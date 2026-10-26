/// <reference path="../pb_data/types.d.ts" />

// Ticketshop-Server-Routen. Alle privilegierte Logik (Preise, Stock, Tickets,
// Payments) lebt hier, nie im Client. Handler sind self-contained (require
// INNERHALB des Handlers, siehe PB-JSVM-Isolation).

// POST /shop/checkout  { items: [{ ticket_type, qty }], provider? }
routerAdd(
  'POST',
  '/api/shop/checkout',
  (e) => {
    const shop = require(`${__hooks}/lib/shop.js`);
    const payments = require(`${__hooks}/lib/payments.js`);
    shop.requireModuleEnabled(e.app);

    const settings = shop.getSettings(e.app);
    const body = e.requestInfo().body || {};
    const items = body.items || [];
    if (!items.length) throw new BadRequestError('Warenkorb ist leer.');

    let provider = body.provider || settings.active_provider;
    if (settings.active_provider !== 'both' && provider !== settings.active_provider) {
      provider = settings.active_provider;
    }
    const effProvider = provider === 'both' ? 'stub' : provider;

    const auth = e.auth;
    const ttlMs = settings.order_ttl_minutes * 60000;
    const nowMs = new Date().getTime();
    let orderId = null;
    let total = 0;

    // Order + Positionen + Reservierung atomar (SQLite serialisiert Writer).
    e.app.runInTransaction((tx) => {
      const ordersCol = tx.findCollectionByNameOrId('shop_orders');
      const order = new Record(ordersCol);
      order.set('buyer', auth.id);
      order.set('status', 'pending');
      order.set('currency', settings.default_currency);
      order.set('provider', effProvider);
      order.set('subtotal', 0);
      order.set('total', 0);
      order.set('expires_at', new Date(nowMs + ttlMs).toISOString());
      tx.save(order);

      const itemsCol = tx.findCollectionByNameOrId('shop_order_items');
      let sum = 0;
      for (const it of items) {
        const qty = parseInt(it.qty, 10);
        if (!qty || qty < 1) throw new BadRequestError('Ungueltige Menge.');
        const tt = tx.findRecordById('shop_ticket_types', it.ticket_type);
        if (!tt.getBool('active')) throw new BadRequestError('Ticket nicht verfuegbar.');
        const limit = tt.getInt('per_order_limit') || 10;
        if (qty > limit) throw new BadRequestError('Ueber dem Limit pro Bestellung.');
        const avail = tt.getInt('quota') - tt.getInt('sold') - tt.getInt('reserved');
        if (qty > avail) {
          throw new ApiError(409, 'Ausverkauft: ' + tt.getString('name'), {});
        }
        tt.set('reserved', tt.getInt('reserved') + qty);
        tx.save(tt);

        const unit = tt.getInt('price'); // Preis IMMER aus der DB
        const line = unit * qty;
        sum += line;
        const item = new Record(itemsCol);
        item.set('order', order.id);
        item.set('ticket_type', tt.id);
        item.set('qty', qty);
        item.set('unit_price', unit);
        item.set('line_total', line);
        tx.save(item);
      }
      order.set('subtotal', sum);
      order.set('total', sum);
      tx.save(order);
      orderId = order.id;
      total = sum;
    });

    // Payment-Intent beim Provider (ausserhalb der Transaktion).
    const order = e.app.findRecordById('shop_orders', orderId);
    const returnUrl = shop.publicUrl() + '/shop/checkout/return?order=' + orderId;
    const apiBase = $os.getenv('SHOP_API_URL') || 'http://127.0.0.1:8090';
    const webhookUrl = apiBase + '/api/shop/webhook/' + effProvider;
    const adapter = payments.getProvider(effProvider);
    const pay = adapter.createPayment({
      order: order,
      amountCents: total,
      currency: settings.default_currency,
      redirectUrl: returnUrl,
      webhookUrl: webhookUrl,
    });

    order.set('provider_payment_id', pay.providerRef);
    e.app.save(order);

    const pc = e.app.findCollectionByNameOrId('shop_payments');
    const p = new Record(pc);
    p.set('order', orderId);
    p.set('provider', effProvider);
    p.set('provider_ref', pay.providerRef);
    p.set('amount', total);
    p.set('currency', settings.default_currency);
    p.set('status', 'open');
    p.set('raw', {});
    e.app.save(p);

    return e.json(200, { order: orderId, checkout_url: pay.checkoutUrl });
  },
  $apis.requireAuth('users'),
);

// POST /shop/dev/complete  { order }  - simuliert die Zahlung im Stub-Modus.
routerAdd(
  'POST',
  '/api/shop/dev/complete',
  (e) => {
    const shop = require(`${__hooks}/lib/shop.js`);
    const body = e.requestInfo().body || {};
    if (!body.order) throw new BadRequestError('order fehlt.');
    const order = e.app.findRecordById('shop_orders', body.order);
    if (order.getString('provider') !== 'stub' || $os.getenv('SHOP_DISABLE_STUB') === '1') {
      throw new BadRequestError('Nur im Stub-Modus erlaubt.');
    }
    if (order.get('buyer') !== e.auth.id) throw new ForbiddenError('Nicht deine Bestellung.');
    shop.markOrderPaid(
      e.app,
      order.id,
      'stub',
      order.getString('provider_payment_id') || 'stub_' + order.id,
      { stub: true },
    );
    return e.json(200, { ok: true });
  },
  $apis.requireAuth('users'),
);

// POST /shop/webhook/mollie  (public, Authentizitaet via API-Re-Fetch)
routerAdd('POST', '/api/shop/webhook/mollie', (e) => {
  const shop = require(`${__hooks}/lib/shop.js`);
  const payments = require(`${__hooks}/lib/payments.js`);
  const adapter = payments.getProvider('mollie');
  const v = adapter.verifyWebhook(e);
  if (!v.ok) return e.json(200, { ignored: true });
  const ev = adapter.parseWebhookEvent(v);
  shop.handlePaymentEvent(e.app, 'mollie', ev);
  return e.json(200, { ok: true });
});

// POST /shop/webhook/stripe  (public, HMAC-Signaturpruefung)
routerAdd('POST', '/api/shop/webhook/stripe', (e) => {
  const shop = require(`${__hooks}/lib/shop.js`);
  const payments = require(`${__hooks}/lib/payments.js`);
  const adapter = payments.getProvider('stripe');
  const v = adapter.verifyWebhook(e);
  if (!v.ok) return e.json(200, { ignored: true });
  const ev = adapter.parseWebhookEvent(v);
  shop.handlePaymentEvent(e.app, 'stripe', ev);
  return e.json(200, { ok: true });
});

// POST /shop/scan  { token, gate? }  - Crew/Admin. Validiert + entwertet.
routerAdd(
  'POST',
  '/api/shop/scan',
  (e) => {
    const shop = require(`${__hooks}/lib/shop.js`);
    const perms = require(`${__hooks}/lib/permissions.js`);
    const flags = perms.loadFlags(e.app, e.auth.id);
    if (flags.role !== 'admin' && !flags.is_crew) throw new ForbiddenError('Nur Crew.');

    const body = e.requestInfo().body || {};
    const parsed = shop.verifyToken(body.token);
    if (!parsed) return e.json(200, { result: 'invalid', reason: 'bad_signature' });

    let result = { result: 'invalid', reason: 'not_found' };
    e.app.runInTransaction((tx) => {
      let ticket;
      try {
        ticket = tx.findFirstRecordByFilter('shop_tickets', 'code = {:c}', { c: parsed.code });
      } catch (err) {
        return;
      }
      const status = ticket.getString('status');
      if (status === 'used') {
        result = {
          result: 'already_used',
          used_at: ticket.getString('used_at'),
          gate: ticket.getString('scanned_gate'),
        };
        return;
      }
      if (status !== 'valid') {
        result = { result: 'invalid', reason: 'void' };
        return;
      }
      ticket.set('status', 'used');
      ticket.set('used_at', new Date().toISOString());
      ticket.set('scanned_by', e.auth.id);
      if (body.gate) ticket.set('scanned_gate', body.gate);
      tx.save(ticket);

      let typeName = '';
      try {
        typeName = tx
          .findRecordById('shop_ticket_types', ticket.get('ticket_type'))
          .getString('name');
      } catch (err) {
        typeName = '';
      }
      result = {
        result: 'valid',
        ticket_type: typeName,
        holder_name: ticket.getString('holder_name'),
      };
    });
    return e.json(200, result);
  },
  $apis.requireAuth('users'),
);
