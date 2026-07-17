/// <reference path="../pb_data/types.d.ts" />

// Passt die OTP-Login-Mail an: enthaelt BEIDES - den Code zum Eintippen UND
// einen klickbaren Magic-Link (/auth/callback?otpId=..&code=..). Der Callback
// der App loggt darueber direkt ein. e.meta.otpId + e.meta.password (Klartext)
// liefert Pocketbase hier bereit.
onMailerRecordOTPSend((e) => {
  const base = (
    $os.getenv('APP_URL') ||
    $os.getenv('SHOP_PUBLIC_URL') ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
  const otpId = e.meta.otpId;
  const code = e.meta.password;
  const link =
    base +
    '/auth/callback?otpId=' +
    encodeURIComponent(otpId) +
    '&code=' +
    encodeURIComponent(code);

  e.message.subject = 'Dein Login-Code fuer Ticketshop';
  e.message.html =
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;padding:32px 0;">' +
    '<div style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">' +
    '<div style="padding:28px 32px 8px;">' +
    '<p style="margin:0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#6b73ff;font-weight:600;">Ticketshop</p>' +
    '<h1 style="margin:8px 0 0;font-size:22px;color:#0a0b10;">Anmelden</h1>' +
    '<p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#4b5162;">Tippe den Code in der App ein oder klicke direkt auf den Button. Gueltig fuer wenige Minuten.</p>' +
    '</div>' +
    '<div style="padding:16px 32px 8px;">' +
    '<div style="background:#f4f5f7;border-radius:12px;padding:16px;text-align:center;">' +
    '<span style="font-family:JetBrains Mono,Consolas,monospace;font-size:30px;letter-spacing:.35em;color:#0a0b10;font-weight:700;">' +
    code +
    '</span>' +
    '</div>' +
    '</div>' +
    '<div style="padding:16px 32px 32px;text-align:center;">' +
    '<a href="' +
    link +
    '" style="display:inline-block;background:#6b73ff;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:9999px;">Jetzt einloggen</a>' +
    '<p style="margin:16px 0 0;font-size:12px;color:#9aa0b0;">Wenn du das nicht warst, ignoriere diese Mail einfach.</p>' +
    '</div>' +
    '</div>' +
    '</div>';

  e.next();
});
