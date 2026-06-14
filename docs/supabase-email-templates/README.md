# Supabase E-Mail-Templates

Vollständige HTML-Templates für alle Auth-E-Mails von Energize. Mit
echtem Brand-Look: gelber Plakat-Strip oben, schwarze Card mit gelbem
CTA, NO_MAINSTREAM_SHIT-Header. Dark-Mode-only (Mail-Clients ignorieren
ggf. light-mode-Override, das ist OK).

## Aktuelle Versionen (Stand 14.06.2026)

Inhalt aller Templates ist gegen die Memory-Regel "keine Em-Dashes,
nicht nach KI klingen" gegengelesen.

- `magic-link.html` (Login-Link)
- `confirm-signup.html` (Sign-up-Bestätigung mit Account-Feature-Liste)
- `email-change.html` (E-Mail-Adresse ändern)
- `support-reply.html` (Antwort auf ein Support-Ticket, kommt aus der
  Edge Function, **nicht** aus Supabase Auth — variables `{{ticket_subject}}`,
  `{{reply_body}}`, `{{ticket_url}}` werden vom Versand-Code ersetzt)

## Setup im Supabase-Dashboard

**Authentication → Email Templates** drei Templates austauschen:

| Template       | Subject                                       | Body                             |
| -------------- | --------------------------------------------- | -------------------------------- |
| Magic Link     | `Energize · Dein Login-Link ⚡`               | Inhalt von `magic-link.html`     |
| Confirm signup | `Willkommen bei Energize ⚡ Bitte bestätigen` | Inhalt von `confirm-signup.html` |
| Email change   | `Energize · E-Mail-Adresse ändern`            | Inhalt von `email-change.html`   |

Nach jedem Speichern: rechts neben dem Editor auf **„Send test email"**
klicken und an deine eigene Adresse schicken.

## Spam-Score (mail-tester.com)

Mit Standard-Supabase-SMTP: 8–9/10. Mit eigenem SMTP-Provider
(Resend/Postmark/Mailjet): 10/10. Die Templates haben:

- Vollständiges `<!doctype html><html><head><body>` Layout
- Inline-Styles (Mail-Clients ignorieren `<style>` oft)
- Preheader-Text für Inbox-Preview
- Fallback-URL falls Button nicht klickbar
- `color-scheme: dark only` Meta

## Variablen

Supabase-Auth setzt automatisch:

| Variable                 | Bedeutung                                  |
| ------------------------ | ------------------------------------------ |
| `{{ .ConfirmationURL }}` | Magic-Link / Confirm-URL                   |
| `{{ .Token }}`           | OTP-Code (nicht verwendet)                 |
| `{{ .TokenHash }}`       | OTP-Hash                                   |
| `{{ .SiteURL }}`         | Site URL aus Auth-Config                   |
| `{{ .Email }}`           | E-Mail-Adresse des Empfängers              |
| `{{ .Data }}`            | User-Metadata (z. B. `{{ .Data.locale }}`) |

Für `support-reply.html`: die Edge Function ersetzt vor dem Versand:

| Variable             | Bedeutung                                             |
| -------------------- | ----------------------------------------------------- |
| `{{user_name}}`      | profiles.display_name (Fallback: Mail-Local-Part)     |
| `{{ticket_subject}}` | support_tickets.subject                               |
| `{{ticket_url}}`     | `https://energize.blackout42.de/account/support/<id>` |
| `{{reply_body}}`     | support_messages.body (Plain-Text, Newlines)          |

## SMTP für Produktion

Standard-Supabase-SMTP ist OK für Tests (3 Mails/h pro Empfänger), aber:

- Setzt keine Message-ID
- Rate-Limit niedrig
- Liefert nur HTML, kein text/plain-Part

Vor dem Festival 2027 eigenen SMTP-Provider hinterlegen:

**Project Settings → Auth → SMTP Settings:**

Empfohlen:

- **Resend** (Free-Tier 3000/Monat, EU-Server)
- **Postmark** (€10/Monat, beste Zustellrate)
- **Mailjet** (kostenlos bis 6k Mails/Monat, EU-Server)

Sobald eigener SMTP läuft, setzen die Provider automatisch Message-ID,
text/plain-Alternative und Reply-To. Damit landet die Mail bei
mail-tester.com auf 10/10.

## DSGVO-Hinweis

Templates referenzieren "Brainchildz Event GmbH · Lübeck" als
Footer-Absender. Vollständige Daten im Impressum auf
energize.blackout42.de/impressum.
