/// <reference path="../pb_data/types.d.ts" />

// Modul 'cost-planning': Kostenplanung pro Edition.
// - booking_editions bekommt Aufbau-/Abbautage + Gesamtbudget (Editionen sind
//   die gemeinsame Klammer fuer DJ-Planung und Kostenplanung).
// - cost_items: Positionen (Kategorie, Abrechnungsart, Tage, Status, bezahlt).
// - cost_offers: Angebote verschiedener Lieferanten je Position (mit PDF).
// Zugriff ueber crew.kosten (crew.guard.pb.js).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const AUTH = '@request.auth.id != ""';

    const editions = app.findCollectionByNameOrId('booking_editions');
    editions.fields.add(new NumberField({ name: 'setup_days', min: 0, max: 14, onlyInt: true }));
    editions.fields.add(new NumberField({ name: 'teardown_days', min: 0, max: 14, onlyInt: true }));
    editions.fields.add(new NumberField({ name: 'total_budget', min: 0 }));
    app.save(editions);

    const items = new Collection({
      type: 'base',
      name: 'cost_items',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'edition',
          required: true,
          maxSelect: 1,
          collectionId: editions.id,
          cascadeDelete: true,
        },
        { type: 'text', name: 'category', required: true, max: 60 },
        { type: 'text', name: 'title', required: true, max: 200 },
        { type: 'text', name: 'supplier', max: 200 },
        {
          type: 'select',
          name: 'pricing',
          required: true,
          maxSelect: 1,
          values: ['pauschal', 'stueck', 'pro_tag', 'stunden'],
        },
        // stueck/pro_tag: Menge; stunden: Anzahl Personen
        { type: 'number', name: 'quantity', min: 0 },
        // stunden: Stunden pro Person und Tag
        { type: 'number', name: 'hours', min: 0 },
        // pauschal: Betrag; sonst Preis je Einheit/Stunde
        { type: 'number', name: 'unit_price', min: 0 },
        // Ausgewaehlte Tage als 'YYYY-MM-DD'
        { type: 'json', name: 'days', maxSize: 4000 },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['offen', 'angefragt', 'angebot', 'beauftragt', 'abgesagt'],
        },
        { type: 'bool', name: 'paid' },
        { type: 'number', name: 'sort', onlyInt: true },
        { type: 'text', name: 'notes', max: 4000 },
        {
          type: 'relation',
          name: 'updated_by',
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cost_items_edition ON cost_items (edition, category)'],
    });
    app.save(items);

    const offers = new Collection({
      type: 'base',
      name: 'cost_offers',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'item',
          required: true,
          maxSelect: 1,
          collectionId: items.id,
          cascadeDelete: true,
        },
        { type: 'text', name: 'supplier', required: true, max: 200 },
        { type: 'text', name: 'contact', max: 300 },
        { type: 'number', name: 'unit_price', min: 0 },
        { type: 'text', name: 'valid_until', pattern: '^(\\d{4}-\\d{2}-\\d{2})?$' },
        { type: 'bool', name: 'chosen' },
        { type: 'text', name: 'notes', max: 2000 },
        {
          type: 'file',
          name: 'file',
          maxSelect: 1,
          maxSize: 20 * 1024 * 1024,
          protected: true,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cost_offers_item ON cost_offers (item)'],
    });
    app.save(offers);

    const resources = app.findCollectionByNameOrId('crew_resources');
    let exists = true;
    try {
      app.findFirstRecordByFilter('crew_resources', "slug = 'crew.kosten'");
    } catch (e) {
      exists = false;
    }
    if (!exists) {
      const rec = new Record(resources);
      rec.set('slug', 'crew.kosten');
      rec.set('label', 'Kostenplanung');
      rec.set('sort_order', 60);
      rec.set('module', 'cost-planning');
      app.save(rec);
    }
  },
  (app) => {
    for (const n of ['cost_offers', 'cost_items']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // weg
      }
    }
    const editions = app.findCollectionByNameOrId('booking_editions');
    for (const f of ['setup_days', 'teardown_days', 'total_budget'])
      editions.fields.removeByName(f);
    app.save(editions);
    try {
      app.delete(app.findFirstRecordByFilter('crew_resources', "slug = 'crew.kosten'"));
    } catch (e) {
      // weg
    }
  },
);
