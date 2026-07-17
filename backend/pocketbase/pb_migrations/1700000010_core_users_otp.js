/// <reference path="../pb_data/types.d.ts" />

// Aktiviert OTP (Magic-Link/One-Time-Code) auf der users-Auth-Collection.
// passwordAuth bleibt aktiv: dient als Fallback und erlaubt lokales Testen
// ohne SMTP. Eine Instanz kann in Produktion passwordAuth deaktivieren, um
// reines Magic-Link zu erzwingen.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.otp.enabled = true;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.otp.enabled = false;
    app.save(users);
  },
);
