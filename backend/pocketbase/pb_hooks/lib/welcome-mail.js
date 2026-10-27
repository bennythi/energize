// Willkommensmail fuer neue Crew-Mitglieder (vom Admin angelegt).
// Absender/Branding kommen aus den Pocketbase-Settings (meta.*).

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function send(app, opts) {
  const meta = app.settings().meta;
  const appName = meta.appName || 'Crew';
  const base = ($os.getenv('APP_URL') || meta.appURL || '').replace(/\/+$/, '');
  const link = base + '/login/?email=' + encodeURIComponent(opts.email) + '&mode=code';
  const hello = opts.name ? 'Hallo ' + escapeHtml(opts.name) + ',' : 'Hallo,';
  const invitedBy = opts.invitedBy ? ' ' + escapeHtml(opts.invitedBy) + ' hat' : ' Wir haben';
  const isCrew = opts.isCrew !== false;
  const title = isCrew ? 'Herzlich willkommen in der Crew!' : 'Herzlich willkommen!';
  const area = isCrew
    ? ' dir einen Zugang zum Crew-Bereich eingerichtet. Dort findest du alles, was wir intern fuer die Organisation brauchen: Kalender, Briefings, Meilensteine und mehr, je nachdem, wofuer du freigeschaltet bist.'
    : ' dir einen Zugang eingerichtet.';
  const howTo = opts.hasPassword
    ? 'Dein Startpasswort bekommst du persoenlich von uns. Du kannst dich aber auch ohne Passwort anmelden: Klick auf den Button und du bekommst einen Login-Link per Mail. Unter Account kannst du danach jederzeit ein eigenes Passwort festlegen.'
    : 'Zum Anmelden brauchst du kein Passwort: Klick auf den Button, gib deine E-Mail-Adresse ein und du bekommst einen Login-Link per Mail. Unter Account kannst du danach ein eigenes Passwort festlegen.';

  const html =
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;padding:32px 0;">' +
    '<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">' +
    '<div style="background:#0a0a0a;padding:28px 32px;">' +
    '<p style="margin:0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#ffe500;font-weight:700;">' +
    escapeHtml(appName) +
    '</p>' +
    '<h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">' +
    title +
    '</h1>' +
    '</div>' +
    '<div style="padding:28px 32px 8px;font-size:15px;line-height:1.6;color:#2b2f3a;">' +
    '<p style="margin:0 0 12px;">' +
    hello +
    '</p>' +
    '<p style="margin:0 0 12px;">schoen, dass du dabei bist!' +
    invitedBy +
    area +
    '</p>' +
    '<p style="margin:0 0 12px;">' +
    howTo +
    '</p>' +
    '</div>' +
    '<div style="padding:8px 32px 28px;text-align:center;">' +
    '<a href="' +
    link +
    '" style="display:inline-block;background:#ffe500;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:15px;padding:13px 30px;border-radius:9999px;">' +
    (isCrew ? 'Zum Crew-Bereich' : 'Zum Login') +
    '</a>' +
    '<p style="margin:14px 0 0;font-size:12px;color:#9aa0b0;">Dein Login: ' +
    escapeHtml(opts.email) +
    '</p>' +
    '</div>' +
    '<div style="padding:16px 32px 24px;border-top:1px solid #eef0f3;font-size:12px;color:#9aa0b0;">' +
    'Du hast diese Mail bekommen, weil dir ein Admin einen Zugang angelegt hat. Falls das ein Versehen ist, antworte einfach auf diese Mail.' +
    '</div>' +
    '</div>' +
    '</div>';

  const message = new MailerMessage({
    from: { address: meta.senderAddress, name: meta.senderName || appName },
    to: [{ address: opts.email }],
    subject: title,
    html: html,
  });
  app.newMailClient().send(message);
}

module.exports = { send };
