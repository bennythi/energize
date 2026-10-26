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

// POST /api/crew/cost-template  { edition, items: [...] }
// Legt viele Kostenpositionen (Vorlage) in einer Transaktion an. Einzeln
// wuerden 70+ Creates in das Rate-Limit laufen. Recht: crew.kosten write.
routerAdd(
  'POST',
  '/api/crew/cost-template',
  (e) => {
    const perms = require(`${__hooks}/lib/permissions.js`);
    if (!perms.crewCan(e.app, e.auth.id, 'crew.kosten', 'write')) {
      throw new ForbiddenError('Keine Berechtigung fuer die Kostenplanung.');
    }
    const data = e.requestInfo().body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    if (!data.edition || items.length === 0 || items.length > 200) {
      throw new BadRequestError('edition und 1-200 Positionen erforderlich.');
    }
    try {
      e.app.findRecordById('booking_editions', String(data.edition));
    } catch (err) {
      throw new NotFoundError('Edition nicht gefunden.');
    }
    const PRICING = ['pauschal', 'stueck', 'pro_tag', 'stunden'];
    const DAY = /^\d{4}-\d{2}-\d{2}$/;
    let created = 0;
    e.app.runInTransaction((txApp) => {
      const col = txApp.findCollectionByNameOrId('cost_items');
      items.forEach((it, idx) => {
        const rec = new Record(col);
        rec.set('edition', String(data.edition));
        rec.set('category', String(it.category || 'sonstiges').slice(0, 60));
        rec.set('title', String(it.title || 'Position').slice(0, 200));
        rec.set('supplier', String(it.supplier || '').slice(0, 200));
        rec.set('pricing', PRICING.indexOf(it.pricing) >= 0 ? it.pricing : 'pauschal');
        rec.set('quantity', Number(it.quantity) || 0);
        rec.set('hours', Number(it.hours) || 0);
        rec.set('unit_price', 0);
        rec.set(
          'days',
          (Array.isArray(it.days) ? it.days : []).filter((d) => DAY.test(String(d))).slice(0, 60),
        );
        rec.set('status', 'offen');
        rec.set('paid', false);
        rec.set('sort', idx);
        rec.set('notes', String(it.notes || '').slice(0, 4000));
        rec.set('updated_by', e.auth.id);
        txApp.save(rec);
        created++;
      });
    });
    return e.json(200, { created });
  },
  $apis.requireAuth('users'),
);
