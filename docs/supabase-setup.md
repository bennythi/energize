# Supabase-Setup — Energize Festival 2027

**Status:** Code für Magic-Link-Login ist im Repo, Supabase-Projekt muss noch angelegt werden.

## 1. Projekt anlegen (~5 min)

1. [supabase.com](https://supabase.com) → Sign in (E-Mail des Brainchildz-Kontos, **nicht** dein persönliches).
2. **New Project**
   - Name: `energize-festival`
   - Org: Brainchildz Event Agentur (anlegen falls noch nicht da)
   - DB-Passwort: stark generieren, in 1Password speichern
   - Region: **Frankfurt (eu-central-1)** — DSGVO-konform
   - Plan: **Free** (bis kurz vor Festival, Pro-Upgrade ist nur Tarif-Switch)
3. Warten bis Status grün ist (~2 min).

## 2. Credentials in `.env` eintragen

Im Supabase-Dashboard → **Project Settings → API**:

- `Project URL` → `PUBLIC_SUPABASE_URL`
- `anon public` key → `PUBLIC_SUPABASE_ANON_KEY`

Datei `apps/web/.env` anlegen (aus `.env.example` kopieren):

```env
PUBLIC_SANITY_PROJECT_ID=oxliq7rf
PUBLIC_SANITY_DATASET=production
PUBLIC_SUPABASE_URL=https://<dein-project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> Die `anon`-Key darf öffentlich sein — RLS-Policies schützen die Daten.
> Service-Role-Key niemals ins Frontend, nur für Sanity-Mod-Tool später.

## 3. Schema anwenden

### Variante A: Direkt im SQL-Editor (schnellste Lösung)

1. Dashboard → **SQL Editor** → **New query**
2. Inhalt von `supabase/migrations/0001_initial.sql` reinkopieren.
3. **Run** klicken.

### Variante B: Supabase-CLI (für spätere Migrations)

```powershell
# CLI installieren (einmalig)
scoop install supabase

# Projekt verknüpfen (einmalig — Project-Ref aus URL)
supabase link --project-ref <ref>

# Schema pushen
supabase db push
```

## 4. Auth-Settings im Dashboard

**Authentication → Providers → Email:**

- ✅ Email enabled
- ✅ Confirm email (Magic-Link-Klick bestätigt automatisch)
- ❌ Enable email signups: AKTIV LASSEN (Magic-Link funktioniert sonst nicht)
- ❌ Phone, Apple, Google etc.: alle aus

**Authentication → URL Configuration:**

- **Site URL:** `http://localhost:5173` (für lokale Entwicklung)
- **Redirect URLs** (alle hinzufügen):
  - `http://localhost:5173/auth/callback`
  - `https://energize-festival.de/auth/callback`
  - `https://www.energize-festival.de/auth/callback`
  - `https://staging.brainchildz.de/auth/callback` (sobald ANPA-Staging-URL feststeht)
  - `capacitor://localhost/auth/callback` (iOS-App)
  - `https://localhost/auth/callback` (Android-App)

## 5. E-Mail-Templates

Komplette Templates (vollständiges HTML, Energize-Branding, DE) liegen
unter [`supabase-email-templates/`](./supabase-email-templates/) inkl.
Setup-Anleitung.

Alle vier Templates ersetzen — der Supabase-Default hat keinen
`<html>`-Tag und triggert Spam-Score-Hinweise:

- `magic-link.html` — Subject: `Dein Login-Link für Energize ⚡`
- `confirm-signup.html` — Subject: `Willkommen bei Energize — bitte E-Mail bestätigen`
- `email-change.html` — Subject: `Energize — E-Mail-Adresse ändern bestätigen`

Mit Standard-Supabase-SMTP bleiben zwei kleine Spam-Hinweise
(`MIME_HTML_ONLY`, `MISSING_MID`) — die verschwinden erst mit eigenem
SMTP-Provider (Postmark/Mailjet/Resend, siehe Template-README).

## 6. Smoke-Test

1. `apps/web/.env` ausgefüllt → `pnpm --filter @energize/web dev`
2. http://localhost:5173/login öffnen
3. Deine E-Mail eingeben → "Magic-Link senden"
4. Mail öffnen → Link klicken
5. Du landest auf `/auth/callback` → Redirect zu `/account`
6. In Supabase Dashboard → **Authentication → Users**: dein User sollte da sein.
7. **Table Editor → profiles**: ein Eintrag mit deiner User-ID sollte angelegt sein
   (durch den Trigger).

## Bekannte Stolpersteine

- **Mail kommt nicht an:** Supabase hat im Free-Tier Default-SMTP mit Rate-Limit (3 Mails/Stunde
  pro Empfänger). Für Produktion eigenen SMTP-Provider in **Project Settings → Auth → SMTP Settings**
  konfigurieren (z. B. Mailjet, Postmark — sind beide auf Brainchildz buchbar).
- **Redirect-URL nicht zugelassen:** dann erscheint "Email link is invalid or expired". Prüfen,
  dass `auth/callback` in den Redirect-URLs steht.
- **Profile-Zeile fehlt:** der Trigger läuft nur bei NEUEM Sign-up. Bei Schema-Änderung an
  bestehenden Usern: manuell `insert into public.profiles ...` ausführen.
- **CORS-Fehler:** Site-URL muss exakt passen — `localhost` vs `127.0.0.1` ist verschieden.

## Was wir bewusst NICHT einrichten

- **Sign-in with Apple/Google** — Festentscheidung 2026-06-01, nur Magic-Link. Damit fällt die
  Apple-Sign-in-Pflicht weg (App-Store-Review-Risiko entschärft).
- **Phone-Auth** — keine SMS-Kosten.
- **Service-Role-Key im Frontend** — niemals. Nur für Sanity-Mod-Tool später (Server-side).
