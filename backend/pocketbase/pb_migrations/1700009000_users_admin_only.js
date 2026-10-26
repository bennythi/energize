/// <reference path="../pb_data/types.d.ts" />

// Keine Selbstregistrierung: User legt nur noch ein Admin an
// (POST /api/admin/invite) bzw. der Superuser. OTP-Login bleibt fuer
// bestehende Accounts aktiv.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.createRule = null;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.createRule = '';
    app.save(users);
  },
);
