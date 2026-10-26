/// <reference path="../pb_data/types.d.ts" />

// Module 'crew-briefings' + 'crew-milestones'. Port von Supabase 0016/0017.
// Autoren-/Erledigt-Felder setzt pb_hooks/lib/crew-stamps.js serverseitig.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const AUTH = '@request.auth.id != ""';
    const userRel = (name) => ({
      type: 'relation',
      name,
      maxSelect: 1,
      collectionId: users.id,
      cascadeDelete: false,
    });

    const briefings = new Collection({
      type: 'base',
      name: 'crew_briefings',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        { type: 'text', name: 'department', required: true, min: 2, max: 80 },
        { type: 'text', name: 'title', required: true, min: 2, max: 200 },
        { type: 'text', name: 'body', max: 50000 },
        { type: 'bool', name: 'pinned' },
        userRel('updated_by'),
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_crew_briefings_dept ON crew_briefings (department)'],
    });
    app.save(briefings);

    const milestones = new Collection({
      type: 'base',
      name: 'crew_milestones',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        { type: 'text', name: 'title', required: true, min: 2, max: 200 },
        { type: 'text', name: 'description', max: 4000 },
        { type: 'text', name: 'category', required: true, min: 2, max: 80 },
        { type: 'text', name: 'due_date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        { type: 'date', name: 'completed_at' },
        userRel('completed_by'),
        userRel('created_by'),
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_crew_milestones_due ON crew_milestones (due_date)'],
    });
    app.save(milestones);
  },
  (app) => {
    for (const n of ['crew_milestones', 'crew_briefings']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // weg
      }
    }
  },
);
