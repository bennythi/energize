/// <reference path="../pb_data/types.d.ts" />

// Rechte-Guard fuer alle Crew-Collections (Kalender, Funk, Briefings,
// Meilensteine, Cashless, DJ-Planung, Kostenplanung). Die Regeln stehen in
// lib/crew-guard.js. Superuser-Requests (Admin-UI, Skripte) laufen durch.
//
// WICHTIG (PB-JSVM): Handler sehen keine Top-Level-Werte dieser Datei, daher
// steht die Collection-Liste in jedem Handler erneut im require().

const GUARDED = [
  'crew_availability',
  'crew_equipment_requests',
  'crew_briefings',
  'crew_milestones',
  'cashless_registers',
  'cashless_shifts',
  'cashless_shift_denominations',
  'cashless_movements',
  'booking_editions',
  'booking_artists',
  'booking_items',
  'cost_items',
  'cost_offers',
];

onRecordsListRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      guard.check(e.app, e.auth ? e.auth.id : '', 'list', e.collection.name, null);
    }
    e.next();
  },
  ...GUARDED,
);

onRecordViewRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      guard.check(e.app, e.auth ? e.auth.id : '', 'view', e.collection.name, e.record);
    }
    e.next();
  },
  ...GUARDED,
);

onRecordCreateRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      guard.check(e.app, e.auth ? e.auth.id : '', 'create', e.collection.name, e.record);
      const stamps = require(`${__hooks}/lib/crew-stamps.js`);
      stamps.apply(e.collection.name, e.record, e.auth.id, 'create');
    }
    e.next();
  },
  ...GUARDED,
);

onRecordUpdateRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      guard.check(e.app, e.auth ? e.auth.id : '', 'update', e.collection.name, e.record);
      const stamps = require(`${__hooks}/lib/crew-stamps.js`);
      stamps.apply(e.collection.name, e.record, e.auth.id, 'update');
    }
    e.next();
  },
  ...GUARDED,
);

onRecordDeleteRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      guard.check(e.app, e.auth ? e.auth.id : '', 'delete', e.collection.name, e.record);
    }
    e.next();
  },
  ...GUARDED,
);

// Jede Ausgabe eines geschuetzten Datensatzes (auch ueber ?expand= von einer
// anderen Collection aus und in Realtime-Nachrichten) laeuft hier durch.
// Ohne Leserecht werden alle Felder ausser der ID ausgeblendet.
onRecordEnrich(
  (e) => {
    const info = e.requestInfo;
    const authRec = info ? info.auth : null;
    const isSuper = authRec && authRec.collection().name === '_superusers';
    if (!isSuper) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      const name = e.record.collection().name;
      if (!guard.canRead(e.app, authRec ? authRec.id : '', name)) {
        const hide = [];
        for (const f of e.record.collection().fields) {
          if (f.getName() !== 'id') hide.push(f.getName());
        }
        e.record.hide(...hide);
      }
    }
    e.next();
  },
  ...GUARDED,
);

// Realtime: Abos auf geschuetzte Collections nur mit Leserecht. Topics koennen
// auch Collection-IDs oder anders geschrieben sein, daher erst aufloesen.
onRealtimeSubscribeRequest((e) => {
  const guard = require(`${__hooks}/lib/crew-guard.js`);
  const authRec = e.client.get('auth');
  const isSuper = authRec && authRec.collection().name === '_superusers';
  if (!isSuper) {
    const authId = authRec ? authRec.id : '';
    for (const sub of e.subscriptions) {
      const raw = String(sub).split('?')[0].split('/')[0];
      let name = raw;
      try {
        name = e.app.findCollectionByNameOrId(raw).name;
      } catch (err) {
        name = raw;
      }
      if (guard.guarded(name) && !guard.canRead(e.app, authId, name)) {
        throw new ForbiddenError('Keine Berechtigung fuer dieses Abo.');
      }
    }
  }
  e.next();
});

// Geschuetzte Dateien (Rider) nur mit Leserecht auf die Collection.
onFileDownloadRequest(
  (e) => {
    if (!e.hasSuperuserAuth()) {
      const guard = require(`${__hooks}/lib/crew-guard.js`);
      // <a href>-Downloads tragen das Datei-Token als ?token=, nicht im Header.
      let authId = e.auth ? e.auth.id : '';
      if (!authId) {
        const token = String(e.requestInfo().query['token'] || '');
        try {
          if (token) authId = e.app.findAuthRecordByToken(token, 'file').id;
        } catch (err) {
          authId = '';
        }
      }
      if (!guard.canRead(e.app, authId, e.record.collection().name)) {
        throw new ForbiddenError('Keine Berechtigung fuer diese Datei.');
      }
    }
    e.next();
  },
  ...GUARDED,
);
