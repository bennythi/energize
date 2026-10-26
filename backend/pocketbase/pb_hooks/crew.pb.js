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

// GET /api/crew/members
// Crew-Mitglieder (Name, Rollen) fuer Kalender, Kasse (zweite Person) usw.
// Nur fuer Crew/Admins; account_flags ist fuer den Client gesperrt.
routerAdd(
  'GET',
  '/api/crew/members',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    const me = perms.loadFlags(e.app, e.auth.id);
    if (!me.is_crew && me.role !== 'admin') throw new ForbiddenError('Nur fuer Crew.');
    const people = require(`${__hooks}/lib/people.js`);
    const items = people
      .listUsers(e.app)
      .filter((r) => r.is_crew || r.role === 'admin')
      .map((r) => ({
        id: r.id,
        display_name: r.display_name,
        handle: r.handle,
        role: r.role,
        crew_roles: r.crew_roles,
      }));
    return e.json(200, { items });
  },
  $apis.requireAuth('users'),
);
