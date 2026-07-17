// Geteilte Ticketshop-Logik (require-bar aus den Route-/Cron-Hooks).
// Geld ueberall in ganzzahligen Cents. Server bepreist jede Order neu aus der
// DB, Client-Preise werden nie vertraut.

function qrSecret() {
  return $os.getenv('SHOP_QR_SECRET') || 'dev-shop-qr-secret-change-me';
}
function qrSecretPrev() {
  return $os.getenv('SHOP_QR_SECRET_PREV') || '';
}
function publicUrl() {
  return $os.getenv('SHOP_PUBLIC_URL') || 'http://localhost:5173';
}

function getSettings(app) {
  const rows = app.findAllRecords('shop_settings');
  if (!rows || rows.length === 0) {
    return {
      module_enabled: false,
      active_provider: 'stub',
      default_currency: 'EUR',
      order_ttl_minutes: 20,
    };
  }
  const r = rows[0];
  return {
    module_enabled: r.getBool('module_enabled'),
    active_provider: r.getString('active_provider') || 'stub',
    default_currency: r.getString('default_currency') || 'EUR',
    order_ttl_minutes: r.getInt('order_ttl_minutes') || 20,
    support_email: r.getString('support_email') || '',
  };
}

// Wirft 404, wenn das Modul fuer diese Instanz nicht aktiv ist.
function requireModuleEnabled(app) {
  if (!getSettings(app).module_enabled) {
    throw new NotFoundError('Ticketshop ist nicht aktiv.');
  }
}

// --- QR-Token: 1.<code>.<hmac>. Signatur schuetzt vor Faelschung. ---
function signCode(code, version) {
  const v = version || 1;
  const payload = v + '.' + code;
  const sig = $security.hs256(payload, qrSecret());
  return v + '.' + code + '.' + sig;
}

// Prueft die Signatur (inkl. Vorgaenger-Secret fuer Rotation). Gibt {code} oder null.
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const v = parts[0];
  const code = parts[1];
  const sig = parts[2];
  const payload = v + '.' + code;
  const expect = $security.hs256(payload, qrSecret());
  if ($security.equal(sig, expect)) return { code: code, version: v };
  const prev = qrSecretPrev();
  if (prev) {
    const expectPrev = $security.hs256(payload, prev);
    if ($security.equal(sig, expectPrev)) return { code: code, version: v };
  }
  return null;
}

// Gibt N Tickets fuer eine bezahlte Order aus (idempotent: nur wenn noch keine da).
function issueTickets(txApp, order) {
  const existing = txApp.findRecordsByFilter('shop_tickets', 'order = {:o}', '', 1, 0, {
    o: order.id,
  });
  if (existing && existing.length > 0) return; // schon ausgegeben

  const items = txApp.findRecordsByFilter('shop_order_items', 'order = {:o}', '', 200, 0, {
    o: order.id,
  });
  const ticketsCol = txApp.findCollectionByNameOrId('shop_tickets');
  for (const item of items) {
    const qty = item.getInt('qty');
    const ttId = item.get('ticket_type');
    for (let i = 0; i < qty; i++) {
      const code = $security.randomString(24);
      const rec = new Record(ticketsCol);
      rec.set('order', order.id);
      rec.set('ticket_type', ttId);
      rec.set('code', code);
      rec.set('qr_token', signCode(code, 1));
      rec.set('token_version', 1);
      rec.set('status', 'valid');
      txApp.save(rec);
    }
  }
}

// Verarbeitet eine erfolgreiche Zahlung idempotent: Payment upsert, Order paid,
// reserved -> sold, Tickets ausgeben, Bestaetigungsmail einreihen.
// Gibt true zurueck, wenn tatsaechlich (erstmalig) verarbeitet wurde.
function markOrderPaid(app, orderId, provider, providerRef, rawObj) {
  let processed = false;
  app.runInTransaction((tx) => {
    const order = tx.findRecordById('shop_orders', orderId);

    // Idempotenz: Payment per provider_ref eindeutig. Existiert bereits?
    let payment = null;
    try {
      payment = tx.findFirstRecordByFilter('shop_payments', 'provider_ref = {:r}', {
        r: providerRef,
      });
    } catch (e) {
      payment = null;
    }
    if (!payment) {
      const pc = tx.findCollectionByNameOrId('shop_payments');
      payment = new Record(pc);
      payment.set('order', order.id);
      payment.set('provider', provider);
      payment.set('provider_ref', providerRef);
      payment.set('amount', order.getInt('total'));
      payment.set('currency', order.getString('currency'));
      payment.set('raw', rawObj || {});
    }
    payment.set('status', 'paid');
    tx.save(payment);

    if (order.getString('status') === 'paid') return; // schon bezahlt, fertig

    // reserved -> sold pro Position
    const items = tx.findRecordsByFilter('shop_order_items', 'order = {:o}', '', 200, 0, {
      o: order.id,
    });
    for (const item of items) {
      const qty = item.getInt('qty');
      const tt = tx.findRecordById('shop_ticket_types', item.get('ticket_type'));
      tt.set('reserved', Math.max(0, tt.getInt('reserved') - qty));
      tt.set('sold', tt.getInt('sold') + qty);
      tx.save(tt);
    }

    order.set('status', 'paid');
    order.set('paid_at', new Date().toISOString());
    tx.save(order);

    issueTickets(tx, order);

    // Bestaetigungsmail einreihen
    const buyer = tx.findRecordById('users', order.get('buyer'));
    const ec = tx.findCollectionByNameOrId('shop_outbound_emails');
    const email = new Record(ec);
    email.set('to', buyer.getString('email'));
    email.set('template', 'order_confirmation');
    email.set('payload', { order: order.id });
    email.set('locale', 'de');
    email.set('status', 'queued');
    email.set('send_after', new Date().toISOString());
    tx.save(email);

    processed = true;
  });
  return processed;
}

// Gibt reservierte Mengen einer (nicht bezahlten) Order wieder frei.
function releaseReservation(tx, order) {
  const items = tx.findRecordsByFilter('shop_order_items', 'order = {:o}', '', 200, 0, {
    o: order.id,
  });
  for (const item of items) {
    const qty = item.getInt('qty');
    try {
      const tt = tx.findRecordById('shop_ticket_types', item.get('ticket_type'));
      tt.set('reserved', Math.max(0, tt.getInt('reserved') - qty));
      tx.save(tt);
    } catch (e) {
      // Ticket-Typ geloescht, ignorieren.
    }
  }
}

// Setzt eine (nicht bezahlte) Order auf expired/cancelled und gibt Stock frei.
function markOrderFailed(app, orderId, newStatus) {
  app.runInTransaction((tx) => {
    const order = tx.findRecordById('shop_orders', orderId);
    if (order.getString('status') === 'paid') return;
    releaseReservation(tx, order);
    order.set('status', newStatus);
    tx.save(order);
  });
}

// Findet die Order-id zu einer Provider-Payment-Referenz.
function findOrderIdByRef(app, providerRef) {
  try {
    return app.findFirstRecordByFilter('shop_orders', 'provider_payment_id = {:r}', {
      r: providerRef,
    }).id;
  } catch (e) {
    return null;
  }
}

// Verarbeitet ein normalisiertes Payment-Event (paid/failed/expired) idempotent.
function handlePaymentEvent(app, provider, ev) {
  let orderId = ev.orderId;
  if (!orderId && ev.providerRef) orderId = findOrderIdByRef(app, ev.providerRef);
  if (!orderId) return;
  if (ev.status === 'paid') markOrderPaid(app, orderId, provider, ev.providerRef, ev.raw);
  else if (ev.status === 'expired') markOrderFailed(app, orderId, 'expired');
  else if (ev.status === 'failed') markOrderFailed(app, orderId, 'cancelled');
}

module.exports = {
  qrSecret,
  publicUrl,
  getSettings,
  requireModuleEnabled,
  signCode,
  verifyToken,
  issueTickets,
  markOrderPaid,
  releaseReservation,
  markOrderFailed,
  findOrderIdByRef,
  handlePaymentEvent,
};
