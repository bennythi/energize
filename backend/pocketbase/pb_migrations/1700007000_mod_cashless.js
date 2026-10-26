/// <reference path="../pb_data/types.d.ts" />

// Modul 'cashless': Top-Up-Kassen mit Schichten, Stueckelung und Bewegungen.
// Port von Supabase 0015. Betraege in Cent. Soll-Bestand rechnet die SPA.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const AUTH = '@request.auth.id != ""';
    const userRel = (name, required) => ({
      type: 'relation',
      name,
      required: !!required,
      maxSelect: 1,
      collectionId: users.id,
      cascadeDelete: false,
    });

    const registers = new Collection({
      type: 'base',
      name: 'cashless_registers',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        { type: 'text', name: 'name', required: true, min: 2, max: 80 },
        { type: 'text', name: 'location', max: 120 },
        { type: 'bool', name: 'is_active' },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    });
    app.save(registers);

    const shifts = new Collection({
      type: 'base',
      name: 'cashless_shifts',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'register',
          required: true,
          maxSelect: 1,
          collectionId: registers.id,
          cascadeDelete: false,
        },
        { type: 'date', name: 'opened_at', required: true },
        userRel('opened_by_a', true),
        userRel('opened_by_b', true),
        { type: 'date', name: 'closed_at' },
        userRel('closed_by_a'),
        userRel('closed_by_b'),
        { type: 'number', name: 'starting_cents', min: 0, onlyInt: true },
        { type: 'number', name: 'ending_cents', min: 0, onlyInt: true },
        { type: 'bool', name: 'has_ending' },
        { type: 'text', name: 'note', max: 1000 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cashless_shifts_reg ON cashless_shifts (register, opened_at)'],
    });
    app.save(shifts);

    const denoms = new Collection({
      type: 'base',
      name: 'cashless_shift_denominations',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'shift',
          required: true,
          maxSelect: 1,
          collectionId: shifts.id,
          cascadeDelete: true,
        },
        { type: 'select', name: 'kind', required: true, maxSelect: 1, values: ['start', 'end'] },
        { type: 'number', name: 'denomination_cents', required: true, min: 1, onlyInt: true },
        { type: 'number', name: 'count', min: 0, onlyInt: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cashless_denoms ON cashless_shift_denominations (shift, kind, denomination_cents)',
      ],
    });
    app.save(denoms);

    const movements = new Collection({
      type: 'base',
      name: 'cashless_movements',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'shift',
          required: true,
          maxSelect: 1,
          collectionId: shifts.id,
          cascadeDelete: true,
        },
        {
          type: 'select',
          name: 'kind',
          required: true,
          maxSelect: 1,
          values: ['withdrawal', 'exchange_in', 'exchange_out'],
        },
        { type: 'number', name: 'amount_cents', required: true, min: 1, onlyInt: true },
        {
          type: 'relation',
          name: 'counterpart_register',
          maxSelect: 1,
          collectionId: registers.id,
          cascadeDelete: false,
        },
        { type: 'date', name: 'performed_at', required: true },
        userRel('performed_by_a', true),
        userRel('performed_by_b', true),
        { type: 'text', name: 'note', max: 500 },
        { type: 'autodate', name: 'created', onCreate: true },
      ],
      indexes: ['CREATE INDEX idx_cashless_mov_shift ON cashless_movements (shift)'],
    });
    app.save(movements);
  },
  (app) => {
    for (const n of [
      'cashless_movements',
      'cashless_shift_denominations',
      'cashless_shifts',
      'cashless_registers',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // weg
      }
    }
  },
);
