/// <reference path="../pb_data/types.d.ts" />

// Modul 'crew-core': Crew-Kalender (Verfuegbarkeiten) + Funkgeraete-Bedarf.
// Port von Supabase 0013. Feinrechte macht pb_hooks/crew.guard.pb.js.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const AUTH = '@request.auth.id != ""';

    const availability = new Collection({
      type: 'base',
      name: 'crew_availability',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { type: 'date', name: 'start_at', required: true },
        { type: 'date', name: 'end_at', required: true },
        {
          type: 'select',
          name: 'kind',
          required: true,
          maxSelect: 1,
          values: ['all_day', 'window'],
        },
        { type: 'text', name: 'note', max: 200 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crew_avail_user ON crew_availability (user, start_at)',
        'CREATE INDEX idx_crew_avail_range ON crew_availability (start_at, end_at)',
      ],
    });
    app.save(availability);

    const equipment = new Collection({
      type: 'base',
      name: 'crew_equipment_requests',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { type: 'text', name: 'event_day', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        {
          type: 'select',
          name: 'equipment',
          required: true,
          maxSelect: 1,
          values: ['razor', 'headphones', 'inear'],
        },
        { type: 'text', name: 'note', max: 200 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_crew_equip_user_day ON crew_equipment_requests (user, event_day)',
        'CREATE INDEX idx_crew_equip_day ON crew_equipment_requests (event_day, equipment)',
      ],
    });
    app.save(equipment);
  },
  (app) => {
    for (const n of ['crew_equipment_requests', 'crew_availability']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // weg
      }
    }
  },
);
