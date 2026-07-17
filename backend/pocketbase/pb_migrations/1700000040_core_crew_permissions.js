/// <reference path="../pb_data/types.d.ts" />

// Granulares Crew-Berechtigungs-Modell (Port von Supabase 0018).
// crew_resources: benannte Ressourcen (pro Modul).
// crew_role_permissions: Level pro Rolle+Ressource.
// crew_user_permissions: Level-Override pro User+Ressource.
// Effektiv = MAX(User-Override, Rollen-Rechte); Admin = immer delete.
// Alle schreibgeschuetzt (null-Regeln): nur Superuser/Admin-Hooks aendern sie.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    const resources = new Collection({
      type: 'base',
      name: 'crew_resources',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'slug', required: true, max: 60 },
        { type: 'text', name: 'label', max: 120 },
        { type: 'number', name: 'sort_order', onlyInt: true },
        { type: 'text', name: 'module', max: 60 },
        { type: 'autodate', name: 'created', onCreate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_crew_resources_slug ON crew_resources (slug)'],
    });
    app.save(resources);

    const rolePerms = new Collection({
      type: 'base',
      name: 'crew_role_permissions',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'role', required: true, max: 60 },
        { type: 'text', name: 'resource', required: true, max: 60 },
        {
          type: 'select',
          name: 'level',
          required: true,
          maxSelect: 1,
          values: ['read', 'write', 'delete'],
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_crew_role_perm ON crew_role_permissions (role, resource)'],
    });
    app.save(rolePerms);

    const userPerms = new Collection({
      type: 'base',
      name: 'crew_user_permissions',
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
        { type: 'text', name: 'resource', required: true, max: 60 },
        {
          type: 'select',
          name: 'level',
          required: true,
          maxSelect: 1,
          values: ['read', 'write', 'delete'],
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_crew_user_perm ON crew_user_permissions (user, resource)'],
    });
    app.save(userPerms);

    // Seed: Standard-Crew-Ressourcen (Energize). Modul-getaggt.
    const seed = [
      { slug: 'crew.kasse', label: 'Kasse / Cashless', sort_order: 10, module: 'cashless' },
      { slug: 'crew.briefings', label: 'Briefings', sort_order: 20, module: 'crew-briefings' },
      {
        slug: 'crew.meilensteine',
        label: 'Meilensteine',
        sort_order: 30,
        module: 'crew-milestones',
      },
      { slug: 'crew.funk', label: 'Funkgeraete', sort_order: 40, module: 'crew-core' },
    ];
    for (const r of seed) {
      const rec = new Record(resources);
      rec.set('slug', r.slug);
      rec.set('label', r.label);
      rec.set('sort_order', r.sort_order);
      rec.set('module', r.module);
      app.save(rec);
    }
  },
  (app) => {
    for (const n of ['crew_user_permissions', 'crew_role_permissions', 'crew_resources']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // Collection existiert nicht mehr, ignorieren.
      }
    }
  },
);
