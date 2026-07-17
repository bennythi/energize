# Support-Ticket-System

Multi-Channel-Postfach für User-Anfragen. Aktuell: Web (Account → Support).
Geplant: Instagram-DMs und Facebook-Messenger in dasselbe UI.

## Was es kann (live)

### User-Seite (`/account/`)

- Ticket erstellen mit Betreff, Kategorie und Text
- Liste aller eigenen Tickets mit Status-Badge
- Detail-View (`/account/support/[id]`) mit Verlauf und Antwort-Möglichkeit
- Status sieht der User automatisch: Offen, In Bearbeitung, Antwort da, Geschlossen

### Admin-Seite (`/admin/support`)

- Inbox mit Filtern: Offen, In Bearbeitung, Beantwortet, Alle
- Sortiert nach Wartezeit aufsteigend (ältester Eintrag oben)
- Wartezeit-Badge wechselt Farbe ab 24h (gelb) und 72h (rot)
- Detail-View mit 6 Antwort-Vorlagen
- Vorlagen ersetzen `{{name}}` durch Displayname des Users
- Status-Wechsel: Schließen / Wieder öffnen

### Status-Automatik (Postgres-Trigger)

- Admin antwortet → Status auf `answered`
- User antwortet auf `answered` → wieder `in_progress`
- Explizit schließen über RPC `admin_close_ticket`

## Mail-Versand: Setup-Schritte

Aktuell schreibt der Trigger `queue_support_reply_mail` jede Admin-Antwort in
die Tabelle `outbound_emails`. Das **versendet noch keine echte Mail** — die
Tabelle ist die Queue, der SMTP-Versand braucht einen extra Schritt.

### Option A: Supabase Edge Function (empfohlen)

1. **SMTP-Provider** wählen (Resend, Mailjet, Postmark) und API-Key besorgen
2. **Edge Function** anlegen, die alle 5 Minuten läuft:
   ```sh
   supabase functions new send-outbound-emails
   ```
3. Function-Code: liest `outbound_emails where sent_at is null`, sendet via
   SMTP, setzt `sent_at = now()`. Bei Fehler `error` füllen.
4. **Cron** über `supabase functions schedule` einrichten.

### Option B: Database Webhook (einfacher, weniger flexibel)

Im Supabase Dashboard: Database → Webhooks → New webhook

- Auf Tabelle `outbound_emails`, Event `INSERT`
- HTTP POST an externen Mail-Service (z. B. Resend webhook URL)
- Custom Headers: `Authorization: Bearer <KEY>`

### Option C: pg_net Direct (für Resend etc.)

Postgres-Extension `pg_net` aktivieren, dann im Trigger direkt
`http_post` zu Resend's API. Schnellster Setup, aber Trigger sind
sync (langsamer) und Errors landen im Postgres-Log statt im
`outbound_emails.error`.

## Antwort-Vorlagen

Aktuell hardcoded in `apps/web/src/routes/admin/support/[id]/+page.svelte`.
Für die nächste Iteration:

- Eigene Tabelle `support_templates` (Admin-pflegbar)
- UI auf der Admin-Seite zum Anlegen/Bearbeiten
- Mehrsprachig (DE/EN) je Template

Aktuelle Vorlagen:

- Tickets · Wo finde ich meine Bestellung?
- Cashless · Restguthaben-Auszahlung
- Account · Magic-Link kommt nicht an
- Foto-Wall · Beitrag wurde abgelehnt
- Allgemein · Wir melden uns mit Update
- Allgemein · Erledigt-Bestätigung

## Instagram + Facebook (geplant)

Voraussetzung Meta-Business-Account und Verbindung der `@energize_offical`
und Facebook-Seite via Graph API. Anschluss-Optionen:

1. **Meta Webhook → outbound_emails-äquivalent**:
   Eigene Tabelle `external_messages` mit Channel-Feld (`instagram` /
   `facebook`), Webhook nimmt DMs entgegen.
2. **Meta-Inbox-Übernahme** (klassisch): tools wie Postmaster oder
   Brevo Conversations, dann Brevo-API anzapfen.

In jedem Fall: Reply zurück an Meta erfordert User-Action innerhalb von
24h (Meta's 24-Hour-Window). Für asynchron-Workflow muss man Quick-Reply-
Templates registrieren.

## Bekannte Limitationen

- **Mail-Versand ist nur Queued** bis Edge Function läuft. Im UI steht
  „Mail an x@y wird per Trigger in outbound_emails queued."
- **Keine Attachments** im aktuellen Schema. Falls nötig: `attachments`-
  Tabelle mit Supabase-Storage-Pfaden.
- **Keine User-Notification beim Reply IM Account**: aktuell muss der User
  selbst auf `/account` schauen. Push (wenn die App da ist) oder
  Realtime-Toast als nächster Schritt.
- **Vorlagen sind hardcoded** statt admin-pflegbar.

## Sicherheit

- RLS erzwingt: User sieht nur eigene Tickets, Admins sehen alle.
- `is_staff = true` nur durch Admin-Check in der Insert-Policy
  möglich. Auch wenn jemand mit Browser-Devtools `is_staff: true`
  setzt: RLS blockt das.
- `admin_close_ticket` und `admin_reopen_ticket` als
  `security definer` RPCs mit `is_admin()`-Check.
- `outbound_emails` hat RLS **ohne Policies** → kein User-Zugriff,
  nur service_role (Edge Function) kann lesen/schreiben.
