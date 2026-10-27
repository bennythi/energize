<?php
// Reverse-Proxy /api/* -> lokale Pocketbase (127.0.0.1).
// Der ISPConfig-Webspace erlaubt kein mod_proxy, PHP-FPM + curl aber schon.
// .user.ini schaltet enable_post_data_reading ab, damit php://input auch bei
// multipart/form-data (Datei-Uploads) den Roh-Body liefert.

declare(strict_types=1);

const PB_UPSTREAM = 'http://127.0.0.1:18095';

function deny(int $code, string $msg): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['code' => $code, 'message' => $msg, 'data' => new stdClass()]);
    exit;
}

// Pfad dekodieren und normalisieren, BEVOR geprueft wird (sonst umgehen
// /api/%72ealtime oder /api/./realtime die Sperren). Weitergeleitet wird der
// normalisierte Pfad, damit Pruefung und Upstream dasselbe sehen.
$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$qPos = strpos($rawUri, '?');
$rawPath = $qPos === false ? $rawUri : substr($rawUri, 0, $qPos);
$query = $qPos === false ? '' : substr($rawUri, $qPos);
$path = rawurldecode($rawPath);
if (preg_match('#[\x00-\x1f\\\\]#', $path) || preg_match('#(^|/)\.\.?(/|$)#', $path)) {
    deny(400, 'Ungueltiger Pfad.');
}
$path = preg_replace('#/+#', '/', $path);
$lowerPath = strtolower($path);

// Allowlist: nur was die App braucht. Gesperrt bleiben damit u.a. Superuser-
// Login, /api/settings, /api/logs, /api/backups, /api/crons, Collection-
// Schemata, /api/batch und /api/realtime (SSE wuerde PHP-Worker blockieren).
$allowed =
    $lowerPath === '/api/health' ||
    preg_match('#^/api/collections/[a-z0-9][a-z0-9_]*/records(/[a-z0-9]+)?$#', $lowerPath) ||
    preg_match('#^/api/collections/users/(auth-with-password|auth-with-otp|request-otp|auth-refresh|auth-methods|request-password-reset|confirm-password-reset)$#', $lowerPath) ||
    $lowerPath === '/api/files/token' ||
    preg_match('#^/api/files/[a-z0-9_]+/[a-z0-9]+/[^/]+$#', $lowerPath) ||
    preg_match('#^/api/(crew|admin|shop)/[a-z0-9/_-]+$#', $lowerPath);
if (!$allowed) {
    deny(404, 'Nicht gefunden.');
}
$uri = $path . $query;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$forward = [];
$incoming = function_exists('getallheaders') ? getallheaders() : [];
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
foreach ($incoming as $name => $value) {
    $hname = strtolower((string) $name);
    if (in_array($hname, ['content-type', 'accept', 'accept-language', 'user-agent', 'authorization', 'range', 'if-none-match', 'if-modified-since'], true)) {
        $forward[$hname] = $name . ': ' . $value;
    }
}
if ($auth !== '' && !isset($forward['authorization'])) {
    $forward['authorization'] = 'Authorization: ' . $auth;
}
$forward[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');
$forward[] = 'X-Forwarded-Proto: https';
$forward[] = 'Expect:';

// Uploads/Downloads duerfen laenger dauern, alles andere kurz halten,
// damit haengende Requests keine PHP-Worker blockieren.
$long = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/') === 0
    || strncmp($lowerPath, '/api/files/', 11) === 0;

$ch = curl_init(PB_UPSTREAM . $uri);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => array_values($forward),
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => $long ? 120 : 30,
]);

if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}
if ($method === 'HEAD') {
    curl_setopt($ch, CURLOPT_NOBODY, true);
}

// Antwort-Header durchreichen (ohne Hop-by-Hop/Laengen, die PHP selbst setzt).
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($ch, string $line): int {
    $len = strlen($line);
    $trim = trim($line);
    if ($trim === '') {
        return $len;
    }
    if (preg_match('#^HTTP/\S+\s+(\d{3})#', $trim, $m)) {
        http_response_code((int) $m[1]);
        return $len;
    }
    $parts = explode(':', $trim, 2);
    if (count($parts) === 2) {
        $name = strtolower(trim($parts[0]));
        // X-Content-Type-Options setzt Apache selbst (sonst doppelt).
        if (!in_array($name, ['transfer-encoding', 'connection', 'content-length', 'keep-alive', 'content-encoding', 'x-content-type-options'], true)) {
            header($trim, false);
        }
    }
    return $len;
});

// Body streamen (grosse Rider-PDFs nicht komplett in den Speicher laden).
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, string $chunk): int {
    echo $chunk;
    if (ob_get_level() > 0) {
        @ob_flush();
    }
    flush();
    return strlen($chunk);
});

$ok = curl_exec($ch);
if ($ok === false) {
    if (!headers_sent()) {
        http_response_code(502);
        header('Content-Type: application/json');
    }
    echo '{"code":502,"message":"Backend nicht erreichbar.","data":{}}';
}
curl_close($ch);
