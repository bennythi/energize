// Gemeinsames Layout fuer System-Mails (Login, Passwort-Reset):
// schwarzer Kopf, gelber Button, Fallback und Hinweis klein darunter.

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseUrl(app) {
  return (
    $os.getenv('APP_URL') ||
    $os.getenv('SHOP_PUBLIC_URL') ||
    app.settings().meta.appURL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
}

/** opts: appName, title, intro, button {href,label}, fallback? (HTML), footer */
function render(opts) {
  return (
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;padding:32px 0;">' +
    '<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">' +
    '<div style="background:#0a0a0a;padding:28px 32px;">' +
    '<p style="margin:0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#ffe500;font-weight:700;">' +
    escapeHtml(opts.appName) +
    '</p>' +
    '<h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">' +
    escapeHtml(opts.title) +
    '</h1>' +
    '</div>' +
    '<div style="padding:28px 32px 4px;font-size:15px;line-height:1.6;color:#2b2f3a;">' +
    '<p style="margin:0;">' +
    escapeHtml(opts.intro) +
    '</p>' +
    '</div>' +
    '<div style="padding:24px 32px 28px;text-align:center;">' +
    '<a href="' +
    escapeHtml(opts.button.href) +
    '" style="display:block;background:#ffe500;color:#0a0a0a;text-decoration:none;font-weight:800;font-size:18px;padding:18px 24px;border-radius:9999px;">' +
    escapeHtml(opts.button.label) +
    ' &rarr;</a>' +
    '</div>' +
    (opts.fallback
      ? '<div style="padding:0 32px 24px;font-size:12px;line-height:1.6;color:#9aa0b0;">' +
        opts.fallback +
        '</div>'
      : '') +
    '<div style="padding:16px 32px 24px;border-top:1px solid #eef0f3;font-size:12px;color:#9aa0b0;">' +
    escapeHtml(opts.footer) +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

module.exports = { escapeHtml, baseUrl, render };
