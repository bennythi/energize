# Magic-Link / Login-Mail einrichten

Der Login ist ein passwortloser OTP-Flow. Die Mail enthaelt BEIDES: einen
Code zum Eintippen UND einen klickbaren Magic-Link
(`/auth/callback?otpId=..&code=..`), der direkt einloggt (auch geraeteuebergreifend,
weil die `otpId` im Link steckt).

Der Mail-INHALT wird vom Hook `backend/pocketbase/pb_hooks/auth.mail.pb.js`
(`onMailerRecordOTPSend`) erzeugt. Damit tatsaechlich Mails rausgehen, muss in
Pocketbase nur **SMTP** konfiguriert sein. Sonst ist nichts zu tun.

## Lokal (Entwicklung) - bereits eingerichtet

Mailpit faengt Mails lokal ab (kein echter Versand):

1. Mailpit starten: `backend/mailpit/mailpit.exe --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025`
2. PB-SMTP zeigt auf Mailpit (Host `127.0.0.1`, Port `1025`, kein TLS/Auth).
   Ist in `pb_data` gespeichert (lokal, nicht im Git).
3. Mails ansehen: http://127.0.0.1:8025

## Produktion (ANPA-SMTP)

In der Pocketbase-Admin-UI (`https://api.<domain>/_/`) unter
**Settings -> Mail settings**:

| Feld           | Wert                                        |
| -------------- | ------------------------------------------- |
| SMTP enabled   | an                                          |
| SMTP host      | ANPA-Mailserver-Host (aus Passwort-Manager) |
| Port           | 587                                         |
| TLS            | an (STARTTLS)                               |
| Username       | ANPA-Mail-User                              |
| Password       | aus Passwort-Manager (NICHT ins Git)        |
| Sender name    | z.B. Ticketshop / Energize                  |
| Sender address | z.B. noreply@energize-festival.de           |

Ausserdem auf dem **Pocketbase-Prozess** die Basis-URL der App setzen, damit
der Magic-Link auf die echte Domain zeigt (nicht localhost):

```
APP_URL=https://<app-domain>
```

(Der Hook nutzt `APP_URL`, faellt sonst auf `SHOP_PUBLIC_URL` bzw.
`http://localhost:5173` zurueck.)

Danach: „Send test email" in der PB-UI zum Pruefen. Fertig. Code- und
Magic-Link-Login funktionieren dann automatisch.

## Sicherheit / Hinweise

- OTP ist einmalig und laeuft nach wenigen Minuten ab (users-Collection,
  `otp.duration`, Standard 180s). Anpassbar in der PB-UI.
- Die Neuanlage eines Users beim ersten Login passiert client-seitig mit einem
  zufaelligen Wegwerf-Passwort (der User nutzt es nie). Rate-Limiting fuer die
  Auth-/OTP-Endpunkte kann in der PB-UI aktiviert werden.
