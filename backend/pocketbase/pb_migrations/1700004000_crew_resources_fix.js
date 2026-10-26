/// <reference path="../pb_data/types.d.ts" />

// Crew-Ressourcen an den portierten Orga-Bereich anpassen:
// crew.funk -> crew.fungeraete (so heisst die Ressource im Crew-Code),
// fehlender crew.kalender und neuer crew.booking (DJ-Planung).
migrate(
  (app) => {
    const resources = app.findCollectionByNameOrId('crew_resources');

    try {
      const funk = app.findFirstRecordByFilter('crew_resources', "slug = 'crew.funk'");
      funk.set('slug', 'crew.fungeraete');
      app.save(funk);
    } catch (e) {
      // Bereits umbenannt.
    }
    for (const n of ['crew_role_permissions', 'crew_user_permissions']) {
      for (const row of app.findRecordsByFilter(n, "resource = 'crew.funk'", '', 0, 0)) {
        row.set('resource', 'crew.fungeraete');
        app.save(row);
      }
    }

    const add = [
      { slug: 'crew.kalender', label: 'Crew-Kalender', sort_order: 5, module: 'crew-core' },
      { slug: 'crew.booking', label: 'DJ-Planung', sort_order: 50, module: 'artist-booking' },
    ];
    for (const r of add) {
      let exists = true;
      try {
        app.findFirstRecordByFilter('crew_resources', 'slug = {:s}', { s: r.slug });
      } catch (e) {
        exists = false;
      }
      if (exists) continue;
      const rec = new Record(resources);
      rec.set('slug', r.slug);
      rec.set('label', r.label);
      rec.set('sort_order', r.sort_order);
      rec.set('module', r.module);
      app.save(rec);
    }
  },
  (app) => {
    for (const slug of ['crew.kalender', 'crew.booking']) {
      try {
        app.delete(app.findFirstRecordByFilter('crew_resources', 'slug = {:s}', { s: slug }));
      } catch (e) {
        // nicht vorhanden
      }
    }
    try {
      const r = app.findFirstRecordByFilter('crew_resources', "slug = 'crew.fungeraete'");
      r.set('slug', 'crew.funk');
      app.save(r);
    } catch (e) {
      // nicht vorhanden
    }
  },
);
