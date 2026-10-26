<?php
// Reverse-Proxy /api/* -> lokale Pocketbase (127.0.0.1).
// Der ISPConfig-Webspace erlaubt kein mod_proxy, PHP-FPM + curl aber schon.
// .user.ini schaltet enable_post_data_reading ab, damit php://input auch bei
// multipart/form-data (Datei-Uploads) den Roh-Body liefert.

declare(strict_types=1);

const PB_UPSTREAM = 'http://127.0.0.1:18095';

$uri = $_SERVER['REQUEST_URI'] ?? '/';
if (strncmp($uri, '/api/', 5) !== 0 && $uri !== '/api') {
    http_response_code(404);
    exit;
}

// Realtime (SSE) wuerde einen PHP-Worker dauerhaft blockieren; die App nutzt es nicht.
if (strncmp($uri, '/api/realtime', 13) === 0) {
    http_response_code(501);
    header('Content-Type: application/json');
    echo '{"code":501,"message":"Realtime ist ueber diesen Proxy nicht verfuegbar.","data":{}}';
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$forward = [];
$incoming = function_exists('getallheaders') ? getallheaders() : [];
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
foreach ($incoming as $name => $value) {
    $lower = strtolower((string) $name);
    if (in_array($lower, ['content-type', 'accept', 'accept-language', 'user-agent', 'authorization', 'range', 'if-none-match', 'if-modified-since'], true)) {
        $forward[$lower] = $name . ': ' . $value;
    }
}
if ($auth !== '' && !isset($forward['authorization'])) {
    $forward['authorization'] = 'Authorization: ' . $auth;
}
$forward[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');
$forward[] = 'X-Forwarded-Proto: https';
$forward[] = 'Expect:';

$ch = curl_init(PB_UPSTREAM . $uri);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => array_values($forward),
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 120,
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
        if (!in_array($name, ['transfer-encoding', 'connection', 'content-length', 'keep-alive', 'content-encoding'], true)) {
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
