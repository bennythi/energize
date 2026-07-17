// Payment-Abstraktion: getProvider(name) liefert einen Adapter mit
//   createPayment, verifyWebhook, parseWebhookEvent, refund.
// Aktiver Anbieter kommt aus shop_settings.active_provider.
// Secrets NUR aus der PB-Prozess-Env (nie in Collections, nie im Client).
// Stub = lokal testbarer Anbieter ohne Konto; Mollie/Stripe sind strukturell
// fertig und melden sich klar ab, solange keine Keys gesetzt sind.

// --- Stub: simuliert Hosted-Checkout, Zahlung wird via /shop/dev/complete ausgeloest. ---
const stub = {
  createPayment: function (args) {
    return {
      providerRef: 'stub_' + args.order.id,
      checkoutUrl: args.redirectUrl, // Return-Seite; "Bezahlen" via Dev-Route
    };
  },
  verifyWebhook: function () {
    return { ok: true };
  },
  parseWebhookEvent: function (body) {
    return { providerRef: body && body.providerRef, status: 'paid', raw: body || {} };
  },
  refund: function () {
    return { ok: true, status: 'refunded' };
  },
};

// --- Mollie (europ. Default). Aktiv, sobald SHOP_MOLLIE_API_KEY gesetzt ist. ---
const mollie = {
  createPayment: function (args) {
    const key = $os.getenv('SHOP_MOLLIE_API_KEY');
    if (!key) throw new BadRequestError('Mollie nicht konfiguriert (SHOP_MOLLIE_API_KEY fehlt).');
    const value = (args.amountCents / 100).toFixed(2);
    const res = $http.send({
      url: 'https://api.mollie.com/v2/payments',
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { currency: args.currency, value: value },
        description: 'Bestellung ' + args.order.id,
        redirectUrl: args.redirectUrl,
        webhookUrl: args.webhookUrl,
        metadata: { orderId: args.order.id },
      }),
    });
    const data = res.json;
    return { providerRef: data.id, checkoutUrl: data._links.checkout.href };
  },
  // Mollie sendet nur die Payment-id; Authentizitaet = erneuter API-Abruf.
  verifyWebhook: function (e) {
    const key = $os.getenv('SHOP_MOLLIE_API_KEY');
    if (!key) return { ok: false, reason: 'not_configured' };
    const id = (e.requestInfo().body || {}).id || e.request.url.query().get('id');
    if (!id) return { ok: false, reason: 'no_id' };
    const res = $http.send({
      url: 'https://api.mollie.com/v2/payments/' + id,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key },
    });
    return { ok: true, payment: res.json };
  },
  parseWebhookEvent: function (verified) {
    const p = verified.payment;
    const statusMap = { paid: 'paid', failed: 'failed', canceled: 'failed', expired: 'expired' };
    return {
      providerRef: p.id,
      status: statusMap[p.status] || 'failed',
      amountCents: p.amount ? Math.round(parseFloat(p.amount.value) * 100) : null,
      orderId: p.metadata && p.metadata.orderId,
      raw: p,
    };
  },
  refund: function () {
    throw new BadRequestError('Mollie-Refund noch nicht implementiert.');
  },
};

// --- Stripe. Aktiv, sobald SHOP_STRIPE_SECRET_KEY gesetzt ist. ---
const stripe = {
  createPayment: function (args) {
    const key = $os.getenv('SHOP_STRIPE_SECRET_KEY');
    if (!key)
      throw new BadRequestError('Stripe nicht konfiguriert (SHOP_STRIPE_SECRET_KEY fehlt).');
    // Stripe Checkout Session (application/x-www-form-urlencoded).
    const form =
      'mode=payment' +
      '&success_url=' +
      encodeURIComponent(args.redirectUrl) +
      '&cancel_url=' +
      encodeURIComponent(args.redirectUrl) +
      '&client_reference_id=' +
      encodeURIComponent(args.order.id) +
      '&line_items[0][price_data][currency]=' +
      encodeURIComponent(args.currency.toLowerCase()) +
      '&line_items[0][price_data][unit_amount]=' +
      args.amountCents +
      '&line_items[0][price_data][product_data][name]=' +
      encodeURIComponent('Bestellung ' + args.order.id) +
      '&line_items[0][quantity]=1';
    const res = $http.send({
      url: 'https://api.stripe.com/v1/checkout/sessions',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const data = res.json;
    return { providerRef: data.id, checkoutUrl: data.url };
  },
  verifyWebhook: function (e) {
    const secret = $os.getenv('SHOP_STRIPE_WEBHOOK_SECRET');
    if (!secret) return { ok: false, reason: 'not_configured' };
    const sigHeader = e.request.header.get('Stripe-Signature') || '';
    const raw = toString(e.request.body);
    let t = '';
    let v1 = '';
    for (const part of sigHeader.split(',')) {
      const [k, val] = part.split('=');
      if (k === 't') t = val;
      if (k === 'v1') v1 = val;
    }
    const expected = $security.hs256(t + '.' + raw, secret);
    if (!$security.equal(v1, expected)) return { ok: false, reason: 'bad_signature' };
    return { ok: true, event: JSON.parse(raw) };
  },
  parseWebhookEvent: function (verified) {
    const ev = verified.event;
    const obj = ev.data && ev.data.object ? ev.data.object : {};
    const paid = ev.type === 'checkout.session.completed' || ev.type === 'payment_intent.succeeded';
    return {
      providerRef: obj.id,
      status: paid ? 'paid' : 'failed',
      amountCents: obj.amount_total != null ? obj.amount_total : null,
      orderId: obj.client_reference_id,
      raw: ev,
    };
  },
  refund: function () {
    throw new BadRequestError('Stripe-Refund noch nicht implementiert.');
  },
};

function getProvider(name) {
  if (name === 'stub') return stub;
  if (name === 'mollie') return mollie;
  if (name === 'stripe') return stripe;
  throw new BadRequestError('Unbekannter Zahlungsanbieter: ' + name);
}

module.exports = { getProvider };
