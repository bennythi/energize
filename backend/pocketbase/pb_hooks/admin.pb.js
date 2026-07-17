/// <reference path="../pb_data/types.d.ts" />

// Admin-Routen: Rollen/Permissions verwalten + View-As.
// Alle erfordern eingeloggten User MIT Admin-Rolle (account_flags.role=admin).
//
// WICHTIG (PB-JSVM): Route-Handler laufen in einem isolierten Kontext und
// sehen KEINE Top-Level-Funktionen dieser Datei. Alle Helfer daher via
// require() aus lib/permissions.js holen, jeder Handler ist self-contained.

// GET /api/admin/view-as/{userId}
routerAdd(
  'GET',
  '/api/admin/view-as/{userId}',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');

    const userId = e.request.pathValue('userId');
    let email = '';
    let displayName = '';
    try {
      email = e.app.findRecordById('users', userId).getString('email');
    } catch (err) {
      throw new NotFoundError('User nicht gefunden.');
    }
    try {
      displayName = e.app
        .findFirstRecordByFilter('profiles', 'user = {:u}', { u: userId })
        .getString('display_name');
    } catch (err) {
      // Kein Profil, Anzeigename bleibt leer.
    }
    const computed = perms.computePermissions(e.app, userId);
    return e.json(200, { userId, email, displayName, ...computed });
  },
  $apis.requireAuth('users'),
);

// POST /api/admin/set-flags  { userId, role?, is_crew?, crew_roles? }
routerAdd(
  'POST',
  '/api/admin/set-flags',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');

    const data = e.requestInfo().body;
    if (!data.userId) throw new BadRequestError('userId fehlt.');
    perms.upsertFlags(e.app, data.userId, {
      role: data.role,
      is_crew: data.is_crew,
      crew_roles: data.crew_roles,
    });
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);

// POST /api/admin/user-permission  { userId, resource, level }  (level null/leer => loeschen)
routerAdd(
  'POST',
  '/api/admin/user-permission',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');

    const data = e.requestInfo().body;
    if (!data.userId || !data.resource) throw new BadRequestError('userId/resource fehlt.');

    let rec = null;
    try {
      rec = e.app.findFirstRecordByFilter(
        'crew_user_permissions',
        'user = {:u} && resource = {:r}',
        { u: data.userId, r: data.resource },
      );
    } catch (err) {
      rec = null;
    }

    if (!data.level) {
      if (rec) e.app.delete(rec);
      return e.json(200, { ok: true, removed: true });
    }
    if (!rec) {
      rec = new Record(e.app.findCollectionByNameOrId('crew_user_permissions'));
      rec.set('user', data.userId);
      rec.set('resource', data.resource);
    }
    rec.set('level', data.level);
    e.app.save(rec);
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);

// POST /api/admin/role-permission  { role, resource, level }  (level null/leer => loeschen)
routerAdd(
  'POST',
  '/api/admin/role-permission',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');

    const data = e.requestInfo().body;
    if (!data.role || !data.resource) throw new BadRequestError('role/resource fehlt.');

    let rec = null;
    try {
      rec = e.app.findFirstRecordByFilter(
        'crew_role_permissions',
        'role = {:r} && resource = {:res}',
        { r: data.role, res: data.resource },
      );
    } catch (err) {
      rec = null;
    }

    if (!data.level) {
      if (rec) e.app.delete(rec);
      return e.json(200, { ok: true, removed: true });
    }
    if (!rec) {
      rec = new Record(e.app.findCollectionByNameOrId('crew_role_permissions'));
      rec.set('role', data.role);
      rec.set('resource', data.resource);
    }
    rec.set('level', data.level);
    e.app.save(rec);
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);
