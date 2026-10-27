/// <reference path="../pb_data/types.d.ts" />

// Login-Mail (OTP): Hauptweg ist der grosse Button mit Magic-Link
// (/auth/callback?otpId=..&code=..), der Zahlencode steht nur klein als
// Fallback darunter. e.meta.otpId + e.meta.password (Klartext) liefert
// Pocketbase hier bereit.
onMailerRecordOTPSend((e) => {
  const mail = require(`${__hooks}/lib/mail-layout.js`);
  const base = mail.baseUrl(e.app);
  const code = e.meta.password;
  const link =
    base +
    '/auth/callback?otpId=' +
    encodeURIComponent(e.meta.otpId) +
    '&code=' +
    encodeURIComponent(code);

  const appName = e.app.settings().meta.appName || 'Crew';
  e.message.subject = 'Dein Login fuer ' + appName;
  e.message.html = mail.render({
    appName: appName,
    title: 'Jetzt einloggen',
    intro: 'Ein Klick auf den Button und du bist drin. Der Link gilt nur wenige Minuten.',
    button: { href: link, label: 'Jetzt einloggen' },
    fallback:
      'Button klappt nicht? Dann gib auf der Login-Seite diesen Code ein: ' +
      '<span style="font-family:Consolas,monospace;font-size:14px;letter-spacing:.2em;color:#2b2f3a;font-weight:700;">' +
      mail.escapeHtml(code) +
      '</span>',
    footer: 'Wenn du das nicht warst, ignoriere diese Mail einfach.',
  });

  e.next();
});

// Passwort zuruecksetzen: Link auf die eigene Seite /auth/reset/ statt auf
// das Pocketbase-Dashboard (das ist von aussen gesperrt).
onMailerRecordPasswordResetSend((e) => {
  const mail = require(`${__hooks}/lib/mail-layout.js`);
  const link = mail.baseUrl(e.app) + '/auth/reset/?token=' + encodeURIComponent(e.meta.token);
  const appName = e.app.settings().meta.appName || 'Crew';
  e.message.subject = 'Neues Passwort fuer ' + appName;
  e.message.html = mail.render({
    appName: appName,
    title: 'Passwort zuruecksetzen',
    intro:
      'Du hast ein neues Passwort angefordert. Klick auf den Button und leg es fest. Der Link gilt 30 Minuten.',
    button: { href: link, label: 'Neues Passwort festlegen' },
    footer:
      'Du hast nichts angefordert? Dann ignoriere diese Mail, dein Passwort bleibt wie es ist.',
  });

  e.next();
});
