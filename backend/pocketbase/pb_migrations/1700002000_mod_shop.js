/// <reference path="../pb_data/types.d.ts" />

// Modul 'ticketshop': eigener Shop (Katalog, Orders, E-Tickets, Payments).
// Geld ueberall in ganzzahligen Cents. Schreibzugriff auf Orders/Tickets/
// Payments NUR ueber pb_hooks (alle null-Regeln) - der Client bepreist nie.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    // shop_settings: eine Zeile pro Instanz. Keine Secrets hier (die liegen
    // in der PB-Prozess-Env), daher oeffentlich lesbar.
    const settings = new Collection({
      type: 'base',
      name: 'shop_settings',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'bool', name: 'module_enabled' },
        {
          type: 'select',
          name: 'active_provider',
          required: true,
          maxSelect: 1,
          values: ['mollie', 'stripe', 'both', 'stub'],
        },
        { type: 'text', name: 'default_currency', required: true, max: 3 },
        { type: 'number', name: 'order_ttl_minutes', onlyInt: true },
        { type: 'text', name: 'support_email', max: 120 },
      ],
    });
    app.save(settings);

    const ticketTypes = new Collection({
      type: 'base',
      name: 'shop_ticket_types',
      listRule: 'active = true',
      viewRule: 'active = true',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'name', required: true, max: 120 },
        { type: 'text', name: 'slug', required: true, max: 80 },
        { type: 'text', name: 'description', max: 2000 },
        { type: 'number', name: 'price', required: true, onlyInt: true },
        { type: 'text', name: 'currency', required: true, max: 3 },
        { type: 'number', name: 'quota', onlyInt: true },
        { type: 'number', name: 'sold', onlyInt: true },
        { type: 'number', name: 'reserved', onlyInt: true },
        { type: 'date', name: 'sales_start' },
        { type: 'date', name: 'sales_end' },
        { type: 'number', name: 'per_order_limit', onlyInt: true },
        { type: 'bool', name: 'active' },
        { type: 'number', name: 'sort', onlyInt: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_shop_ticket_types_slug ON shop_ticket_types (slug)'],
    });
    app.save(ticketTypes);

    const orders = new Collection({
      type: 'base',
      name: 'shop_orders',
      listRule: 'buyer = @request.auth.id',
      viewRule: 'buyer = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'buyer',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['draft', 'pending', 'paid', 'cancelled', 'refunded', 'expired'],
        },
        { type: 'text', name: 'currency', required: true, max: 3 },
        { type: 'number', name: 'subtotal', onlyInt: true },
        { type: 'number', name: 'total', onlyInt: true },
        {
          type: 'select',
          name: 'provider',
          maxSelect: 1,
          values: ['mollie', 'stripe', 'stub'],
        },
        { type: 'text', name: 'provider_payment_id', max: 200 },
        { type: 'date', name: 'expires_at' },
        { type: 'date', name: 'paid_at' },
      ],
      indexes: [
        'CREATE INDEX idx_shop_orders_buyer ON shop_orders (buyer)',
        'CREATE INDEX idx_shop_orders_pp ON shop_orders (provider_payment_id)',
      ],
    });
    app.save(orders);

    const orderItems = new Collection({
      type: 'base',
      name: 'shop_order_items',
      listRule: 'order.buyer = @request.auth.id',
      viewRule: 'order.buyer = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'order',
          required: true,
          maxSelect: 1,
          collectionId: orders.id,
          cascadeDelete: true,
        },
        {
          type: 'relation',
          name: 'ticket_type',
          required: true,
          maxSelect: 1,
          collectionId: ticketTypes.id,
          cascadeDelete: false,
        },
        { type: 'number', name: 'qty', required: true, onlyInt: true },
        { type: 'number', name: 'unit_price', required: true, onlyInt: true },
        { type: 'number', name: 'line_total', required: true, onlyInt: true },
      ],
      indexes: ['CREATE INDEX idx_shop_order_items_order ON shop_order_items (order)'],
    });
    app.save(orderItems);

    const tickets = new Collection({
      type: 'base',
      name: 'shop_tickets',
      listRule: 'order.buyer = @request.auth.id',
      viewRule: 'order.buyer = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'order',
          required: true,
          maxSelect: 1,
          collectionId: orders.id,
          cascadeDelete: true,
        },
        {
          type: 'relation',
          name: 'ticket_type',
          required: true,
          maxSelect: 1,
          collectionId: ticketTypes.id,
          cascadeDelete: false,
        },
        { type: 'text', name: 'holder_name', max: 120 },
        { type: 'text', name: 'code', required: true, max: 40 },
        { type: 'text', name: 'qr_token', max: 500 },
        { type: 'number', name: 'token_version', onlyInt: true },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['valid', 'used', 'void'],
        },
        { type: 'date', name: 'used_at' },
        {
          type: 'relation',
          name: 'scanned_by',
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        },
        { type: 'text', name: 'scanned_gate', max: 60 },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_shop_tickets_code ON shop_tickets (code)',
        'CREATE INDEX idx_shop_tickets_order ON shop_tickets (order)',
      ],
    });
    app.save(tickets);

    const payments = new Collection({
      type: 'base',
      name: 'shop_payments',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'relation',
          name: 'order',
          required: true,
          maxSelect: 1,
          collectionId: orders.id,
          cascadeDelete: true,
        },
        { type: 'select', name: 'provider', maxSelect: 1, values: ['mollie', 'stripe', 'stub'] },
        { type: 'text', name: 'provider_ref', required: true, max: 200 },
        { type: 'number', name: 'amount', onlyInt: true },
        { type: 'text', name: 'currency', max: 3 },
        {
          type: 'select',
          name: 'status',
          maxSelect: 1,
          values: ['open', 'paid', 'failed', 'expired', 'refunded'],
        },
        { type: 'json', name: 'raw', maxSize: 100000 },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_shop_payments_ref ON shop_payments (provider_ref)'],
    });
    app.save(payments);

    const emails = new Collection({
      type: 'base',
      name: 'shop_outbound_emails',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'to', required: true, max: 120 },
        { type: 'text', name: 'template', required: true, max: 60 },
        { type: 'json', name: 'payload', maxSize: 20000 },
        { type: 'text', name: 'locale', max: 5 },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['queued', 'sending', 'sent', 'failed'],
        },
        { type: 'number', name: 'attempts', onlyInt: true },
        { type: 'text', name: 'last_error', max: 500 },
        { type: 'date', name: 'send_after' },
      ],
    });
    app.save(emails);

    // Seed: Settings + Beispiel-Ticket-Typen (Energize). Stub-Provider als
    // Default, damit der Flow ohne Mollie/Stripe-Konto testbar ist.
    const s = new Record(settings);
    s.set('module_enabled', true);
    s.set('active_provider', 'stub');
    s.set('default_currency', 'EUR');
    s.set('order_ttl_minutes', 20);
    s.set('support_email', 'support@energize-festival.de');
    app.save(s);

    const seedTypes = [
      {
        name: 'Weekend Ticket',
        slug: 'weekend',
        price: 8900,
        quota: 1000,
        per_order_limit: 6,
        sort: 10,
      },
      {
        name: 'Day Ticket Samstag',
        slug: 'day-sat',
        price: 4900,
        quota: 500,
        per_order_limit: 6,
        sort: 20,
      },
      {
        name: 'Parkticket',
        slug: 'parking',
        price: 1500,
        quota: 300,
        per_order_limit: 4,
        sort: 30,
      },
    ];
    for (const t of seedTypes) {
      const rec = new Record(ticketTypes);
      rec.set('name', t.name);
      rec.set('slug', t.slug);
      rec.set('description', '');
      rec.set('price', t.price);
      rec.set('currency', 'EUR');
      rec.set('quota', t.quota);
      rec.set('sold', 0);
      rec.set('reserved', 0);
      rec.set('per_order_limit', t.per_order_limit);
      rec.set('active', true);
      rec.set('sort', t.sort);
      app.save(rec);
    }
  },
  (app) => {
    for (const n of [
      'shop_outbound_emails',
      'shop_payments',
      'shop_tickets',
      'shop_order_items',
      'shop_orders',
      'shop_ticket_types',
      'shop_settings',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // ignorieren
      }
    }
  },
);
