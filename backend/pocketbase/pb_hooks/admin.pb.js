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

// POST /api/admin/set-password  { userId, password }  Startpasswort setzen
// (fuer Accounts aus dem Code-Login, deren Zufallspasswort niemand kennt).
routerAdd(
  'POST',
  '/api/admin/set-password',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const data = e.requestInfo().body;
    const password = String(data.password || '');
    if (!data.userId) throw new BadRequestError('userId fehlt.');
    if (password.length < 10) throw new BadRequestError('Passwort braucht mindestens 10 Zeichen.');
    let user;
    try {
      user = e.app.findRecordById('users', data.userId);
    } catch (err) {
      throw new NotFoundError('User nicht gefunden.');
    }
    user.setPassword(password);
    e.app.save(user);
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);

// POST /api/admin/invite
//   { email, first_name?, last_name?, phone?, display_name?, crew_roles?, role?,
//     is_crew? (Standard true), password? (Startpasswort), send_mail? (Standard true) }
// Legt einen User an (Selbstregistrierung ist gesperrt) und schickt auf Wunsch
// die Willkommensmail. Login danach per Code, Startpasswort oder Reset-Link.
routerAdd(
  'POST',
  '/api/admin/invite',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');

    const data = e.requestInfo().body || {};
    const email = String(data.email || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      throw new BadRequestError('Bitte eine gueltige E-Mail-Adresse angeben.');
    }
    const clean = (v, max) =>
      String(v || '')
        .trim()
        .slice(0, max);
    const firstName = clean(data.first_name, 80);
    const lastName = clean(data.last_name, 80);
    const phone = clean(data.phone, 40);
    if (phone && !/^\+?[0-9 ()\/-]{6,30}$/.test(phone)) {
      throw new BadRequestError('Bitte eine gueltige Handynummer angeben.');
    }
    const name = clean(data.display_name, 80) || clean(firstName + ' ' + lastName, 80);
    const isCrew = data.is_crew !== false;
    const sendMail = data.send_mail !== false;
    const password = data.password ? String(data.password) : '';
    if (password && (password.length < 10 || password.length > 72)) {
      throw new BadRequestError('Das Startpasswort braucht 10 bis 72 Zeichen.');
    }
    const role = data.role === 'admin' ? 'admin' : 'user';
    const roles = (Array.isArray(data.crew_roles) ? data.crew_roles : [])
      .map((r) => String(r).trim().toLowerCase().replace(/\s+/g, '_').slice(0, 40))
      .filter((r) => r)
      .slice(0, 20);

    let exists = true;
    try {
      e.app.findAuthRecordByEmail('users', email);
    } catch (err) {
      exists = false;
    }
    if (exists) throw new BadRequestError('Diese E-Mail-Adresse hat schon einen Zugang.');

    let userId = '';
    e.app.runInTransaction((txApp) => {
      const user = new Record(txApp.findCollectionByNameOrId('users'));
      user.setEmail(email);
      user.setVerified(true);
      if (password) user.setPassword(password);
      else user.setRandomPassword();
      txApp.save(user);
      userId = user.id;

      const profile = new Record(txApp.findCollectionByNameOrId('profiles'));
      profile.set('user', user.id);
      profile.set('display_name', name);
      profile.set('first_name', firstName);
      profile.set('last_name', lastName);
      profile.set('phone', phone);
      profile.set('handle', '');
      profile.set('locale', 'de');
      txApp.save(profile);

      perms.upsertFlags(txApp, user.id, { role, is_crew: isCrew, crew_roles: isCrew ? roles : [] });
    });

    if (!sendMail) return e.json(200, { id: userId, mailSent: false });
    let mailSent = true;
    try {
      let invitedBy = '';
      try {
        invitedBy = e.app
          .findFirstRecordByFilter('profiles', 'user = {:u}', { u: e.auth.id })
          .getString('display_name');
      } catch (err) {
        invitedBy = '';
      }
      require(`${__hooks}/lib/welcome-mail.js`).send(e.app, {
        email,
        name: firstName || name,
        invitedBy,
        hasPassword: !!password,
        isCrew,
      });
    } catch (err) {
      mailSent = false;
      e.app.logger().error('Willkommensmail fehlgeschlagen', 'email', email, 'error', String(err));
    }
    return e.json(200, { id: userId, mailSent });
  },
  $apis.requireAuth('users'),
);

// POST /api/admin/resend-welcome  { userId }
routerAdd(
  'POST',
  '/api/admin/resend-welcome',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.isAdmin(e.app, e.auth.id)) throw new ForbiddenError('Nur fuer Admins.');
    const data = e.requestInfo().body || {};
    let user;
    try {
      user = e.app.findRecordById('users', String(data.userId || ''));
    } catch (err) {
      throw new NotFoundError('User nicht gefunden.');
    }
    let name = '';
    let invitedBy = '';
    try {
      name = e.app
        .findFirstRecordByFilter('profiles', 'user = {:u}', { u: user.id })
        .getString('display_name');
      invitedBy = e.app
        .findFirstRecordByFilter('profiles', 'user = {:u}', { u: e.auth.id })
        .getString('display_name');
    } catch (err) {
      // Profile optional
    }
    try {
      require(`${__hooks}/lib/welcome-mail.js`).send(e.app, {
        email: user.email(),
        name,
        invitedBy,
      });
    } catch (err) {
      throw new BadRequestError('Mail konnte nicht gesendet werden: ' + String(err));
    }
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);
