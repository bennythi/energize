/// <reference path="../pb_data/types.d.ts" />

// Modul 'support': Referenz-Modul auf Pocketbase.
// User erstellt Tickets + Nachrichten, liest nur die eigenen.
// (Modul-Gating pro Instanz ueber ENABLED_MODULES kommt mit dem
//  Multi-Instanz-Deploy in einer spaeteren Phase; lokal immer aktiv.)
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    const tickets = new Collection({
      type: 'base',
      name: 'support_tickets',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
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
        { type: 'text', name: 'subject', required: true, max: 120 },
        {
          type: 'select',
          name: 'category',
          maxSelect: 1,
          values: ['account', 'ticket', 'cashless', 'wall', 'tech', 'other'],
        },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['open', 'in_progress', 'answered', 'closed'],
        },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_support_tickets_user ON support_tickets (user)'],
    });
    app.save(tickets);

    const messages = new Collection({
      type: 'base',
      name: 'support_messages',
      listRule: 'ticket.user = @request.auth.id',
      viewRule: 'ticket.user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.author = @request.auth.id',
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'ticket',
          required: true,
          maxSelect: 1,
          collectionId: tickets.id,
          cascadeDelete: true,
        },
        {
          type: 'relation',
          name: 'author',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { type: 'text', name: 'body', required: true, max: 4000 },
        { type: 'bool', name: 'is_staff' },
        { type: 'autodate', name: 'created', onCreate: true },
      ],
      indexes: ['CREATE INDEX idx_support_messages_ticket ON support_messages (ticket)'],
    });
    app.save(messages);
  },
  (app) => {
    for (const n of ['support_messages', 'support_tickets']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // ignorieren
      }
    }
  },
);
