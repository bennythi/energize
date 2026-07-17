/// <reference path="../pb_data/types.d.ts" />

// Ergaenzt created/updated-Zeitstempel fuer die Shop-Entitaeten, die
// chronologisch gelistet werden (z.B. /account/tickets sortiert nach -created).
// Additiv, damit bestehende Daten erhalten bleiben.
const TARGETS = ['shop_orders', 'shop_order_items', 'shop_tickets', 'shop_payments'];

migrate(
  (app) => {
    for (const name of TARGETS) {
      const c = app.findCollectionByNameOrId(name);
      c.fields.add(new Field({ type: 'autodate', name: 'created', onCreate: true }));
      c.fields.add(
        new Field({ type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }),
      );
      app.save(c);
    }
  },
  (app) => {
    for (const name of TARGETS) {
      try {
        const c = app.findCollectionByNameOrId(name);
        c.fields.removeByName('created');
        c.fields.removeByName('updated');
        app.save(c);
      } catch (e) {
        // ignorieren
      }
    }
  },
);
