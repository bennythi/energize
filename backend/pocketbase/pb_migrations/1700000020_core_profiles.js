/// <reference path="../pb_data/types.d.ts" />

// profiles: selbst-editierbare Profildaten, 1-1 zur users-Auth-Collection.
// Oeffentlich lesbar (Community-Verzeichnis). Enthaelt bewusst KEINE
// privilegierten Felder (Rolle/Crew) -> siehe account_flags.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const c = new Collection({
      type: 'base',
      name: 'profiles',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: 'user = @request.auth.id',
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
        { type: 'text', name: 'display_name', max: 80 },
        { type: 'text', name: 'handle', max: 40 },
        { type: 'file', name: 'avatar', maxSelect: 1, maxSize: 5242880 },
        { type: 'text', name: 'locale', max: 5 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_profiles_user ON profiles (user)',
        "CREATE UNIQUE INDEX idx_profiles_handle ON profiles (handle) WHERE handle != ''",
      ],
    });
    app.save(c);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('profiles'));
  },
);
