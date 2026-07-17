/// <reference path="../pb_data/types.d.ts" />

// account_flags: privilegierte Kontostatus-Felder (Rolle, Crew-Flag).
// Alle Regeln null => nur Superuser bzw. pb_hooks duerfen lesen/schreiben.
// Damit ist Rechte-Eskalation ausgeschlossen: der Client schreibt hier nie.
// Die App erfaehrt Rolle/Crew ueber die Route /api/crew/my-permissions.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const c = new Collection({
      type: 'base',
      name: 'account_flags',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { type: 'select', name: 'role', required: true, maxSelect: 1, values: ['user', 'admin'] },
        { type: 'bool', name: 'is_crew' },
        { type: 'json', name: 'crew_roles', maxSize: 2000 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_account_flags_user ON account_flags (user)'],
    });
    app.save(c);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('account_flags'));
  },
);
