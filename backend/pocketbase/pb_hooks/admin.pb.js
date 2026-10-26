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

// GET /api/admin/users?q=...  Alle User mit Profil + Flags (Admin-Nutzerliste).
routerAdd(
  'GET',
  '/api/admin/users',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const people = require(`${__hooks}/lib/people.js`);
    const q = String(e.request.url.query().get('q') || '')
      .trim()
      .toLowerCase();
    let rows = people.listUsers(e.app);
    if (q) {
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.display_name.toLowerCase().includes(q) ||
          r.handle.toLowerCase().includes(q),
      );
    }
    return e.json(200, { items: rows });
  },
  $apis.requireAuth('users'),
);

// GET /api/admin/crew  Nur User mit Crew-Flag oder Admin-Rolle.
routerAdd(
  'GET',
  '/api/admin/crew',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const people = require(`${__hooks}/lib/people.js`);
    const rows = people.listUsers(e.app).filter((r) => r.is_crew || r.role === 'admin');
    return e.json(200, { items: rows });
  },
  $apis.requireAuth('users'),
);

// DELETE /api/admin/users/{id}  User samt Profil/Flags loeschen (Cascade).
routerAdd(
  'DELETE',
  '/api/admin/users/{id}',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const id = e.request.pathValue('id');
    if (id === e.auth.id) throw new BadRequestError('Du kannst dich nicht selbst loeschen.');
    let user;
    try {
      user = e.app.findRecordById('users', id);
    } catch (err) {
      throw new NotFoundError('User nicht gefunden.');
    }
    e.app.delete(user);
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);

// GET /api/admin/permissions  Ressourcen + Rollen-Rechte + User-Overrides.
routerAdd(
  'GET',
  '/api/admin/permissions',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const resources = e.app
      .findAllRecords('crew_resources')
      .map((r) => ({
        slug: r.getString('slug'),
        label: r.getString('label'),
        module: r.getString('module'),
        sort_order: r.getInt('sort_order'),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
    const rolePermissions = e.app.findAllRecords('crew_role_permissions').map((r) => ({
      role: r.getString('role'),
      resource: r.getString('resource'),
      level: r.getString('level'),
    }));
    const userPermissions = e.app.findAllRecords('crew_user_permissions').map((r) => ({
      user: r.getString('user'),
      resource: r.getString('resource'),
      level: r.getString('level'),
    }));
    return e.json(200, { resources, rolePermissions, userPermissions });
  },
  $apis.requireAuth('users'),
);
