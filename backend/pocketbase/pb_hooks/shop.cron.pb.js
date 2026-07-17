/// <reference path="../pb_data/types.d.ts" />

// Cron: abgelaufene, nicht bezahlte Orders verfallen lassen + Stock freigeben.
cronAdd('shop_expire_orders', '*/5 * * * *', () => {
  const shop = require(`${__hooks}/lib/shop.js`);
  const now = new Date().toISOString();
  let stale;
  try {
    stale = $app.findRecordsByFilter(
      'shop_orders',
      'status = "pending" && expires_at < {:now}',
      '',
      200,
      0,
      { now: now },
    );
  } catch (e) {
    return;
  }
  for (const order of stale) {
    try {
      shop.markOrderFailed($app, order.id, 'expired');
    } catch (e) {
      // einzelne Order-Fehler ignorieren
    }
  }
});

// Cron: Bestaetigungs-Mails aus der Queue versenden (braucht konfiguriertes SMTP).
cronAdd('shop_drain_emails', '* * * * *', () => {
  try {
    if (!$app.settings().smtp.enabled) return; // ohne SMTP nichts tun
  } catch (e) {
    return;
  }
  const now = new Date().toISOString();
  let queued;
  try {
    queued = $app.findRecordsByFilter(
      'shop_outbound_emails',
      'status = "queued" && send_after <= {:now}',
      '',
      50,
      0,
      { now: now },
    );
  } catch (e) {
    return;
  }
  for (const em of queued) {
    try {
      em.set('status', 'sending');
      $app.save(em);
      const message = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress,
          name: $app.settings().meta.senderName,
        },
        to: [{ address: em.getString('to') }],
        subject: 'Deine Bestellung',
        html: '<p>Danke fuer deine Bestellung. Deine Tickets liegen in deinem Account bereit.</p>',
      });
      $app.newMailClient().send(message);
      em.set('status', 'sent');
      $app.save(em);
    } catch (err) {
      em.set('status', 'failed');
      em.set('attempts', em.getInt('attempts') + 1);
      em.set('last_error', '' + err);
      $app.save(em);
    }
  }
});
