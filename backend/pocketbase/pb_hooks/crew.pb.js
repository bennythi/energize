/// <reference path="../pb_data/types.d.ts" />

// GET /api/crew/my-permissions
// Liefert dem eingeloggten User seine effektiven Rechte (Rolle, Crew-Flag,
// Permission-Map). Die App hydratisiert daraus ihren Auth-Store.
routerAdd(
  'GET',
  '/api/crew/my-permissions',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    const result = perms.computePermissions(e.app, e.auth.id);
    return e.json(200, result);
  },
  $apis.requireAuth('users'),
);
