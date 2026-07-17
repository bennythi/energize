# Projektstatus event-platform

Stand: 2026-07-16 (autonome Nacht-Session). Alles unten ist gebaut, getypt,
gelintet und (wo moeglich) end-to-end verifiziert. `pnpm turbo run typecheck lint`
und `pnpm build:energize` / `pnpm build:demo` sind gruen.

> Hinweis: `HANDOFF.md` und `README.md` im Root stammen aus dem ALTEN Repo
> (Supabase/Sanity) und sind teils veraltet. Diese Datei ist der aktuelle Stand.

## Was fertig ist

**Phase 0 - Neutraler Kern + Instanz-Theming**

- Neues Repo, Scope `@platform/*`, Design-Tokens neutralisiert
  (`packages/design-tokens/src/theme.css` = einzige Quelle), Duplikate entfernt.
- Instanzen `instances/energize` (Gelb/Schwarz) + `instances/demo` (Emerald).
  Auswahl via `INSTANCE=<slug>` + `$instance`-Alias. Kaskade in `app.css`.
- Verifiziert: energize-Build enthaelt Gelb, demo-Build Gruen, kein Cross-Leak.

**Phase 1 - Modul-System**

- `packages/modules` (Registry, `moduleEnabled`, `requireModule`).
- Navigation config-getrieben: Links deaktivierter Module blenden sich aus.

**Phase 2 - Account-Kern auf Pocketbase** (Supabase abgeloest)

- Pocketbase v0.39.7 lokal unter `backend/pocketbase/` (Binary + `pb_data`
  gitignored). Core-Migrationen: users (OTP), `profiles`, `account_flags`
  (Rolle/Crew, nur Superuser/Hooks schreibbar), Crew-Permission-Modell.
- `pb_hooks`: `GET /api/crew/my-permissions`, Admin-Routen (View-As, set-flags,
  role/user-permission). `packages/pb-client` mit generierten Typen.
- `auth.svelte.ts` auf PB portiert (OTP-Login, Profil-Sicherstellung, Rechte,
  View-As). Login (OTP-Code-Flow), Account, Support-Modul auf PB.
- Verifiziert: 19/19 (Rechte-Ketten) + 15/15 (Profil/Support/Isolation).

**Phase 3 - Ticketshop** (das Kern-Modul, mit dem gestartet wurde)

- Backend: `shop_*`-Collections, Routen unter `/api/shop/*` (checkout, webhook/
  mollie, webhook/stripe, scan, dev/complete), Cron (Expiry + Mail-Queue).
  Payment-Abstraktion mit **Stub** (Default, lokal ohne Konto testbar) sowie
  **Mollie**- und **Stripe**-Adaptern (strukturell fertig, greifen sobald
  `SHOP_MOLLIE_API_KEY` / `SHOP_STRIPE_SECRET_KEY` gesetzt sind). QR-E-Tickets
  HMAC-signiert (`$security.hs256`), serverseitige Bepreisung + atomare
  Reservierung, idempotente Zahlungsverarbeitung, Doppelscan-Schutz.
- UI: `/shop` (Katalog), Cart-Store, `/shop/checkout`, `/shop/checkout/return`
  (im Stub-Modus "Zahlung simulieren"), `/account/tickets` (QR), `/scan` (Crew,
  manuelle Token-Eingabe).
- Verifiziert: 19/19 (Katalog -> Checkout -> Bezahlung -> Tickets -> Scan ->
  Doppelscan -> Oversell/Limit -> Isolation). UI-Routen liefern HTTP 200.

## Lokal starten

```powershell
# 1. Pocketbase (Backend) - laeuft evtl. schon aus der Session
pnpm pb:serve            # http://127.0.0.1:8090  (Admin-UI: /_/  admin@local.test)

# 2. App (in zweitem Terminal)
pnpm dev:energize        # http://localhost:5173   (INSTANCE=energize)
pnpm dev:demo            # alternative Instanz (andere Marke, weniger Module)

# Qualitaet
pnpm turbo run typecheck lint
pnpm build:energize      # bzw. build:demo

# Nach PB-Schema-Aenderungen: Typen neu generieren
pnpm pb:typegen
```

Test-Ticketshop lokal: einloggen ist ohne SMTP nicht komplett (OTP-Mail).
Fuer einen schnellen Durchlauf einen User mit Passwort anlegen (Admin-UI oder
API) und einloggen, dann `/shop` -> Warenkorb -> Kasse -> Return-Seite ->
"Zahlung simulieren" -> `/account/tickets`. Die Backend-Flows sind zusaetzlich
per Node-Skripten geprueft.

## Was noch offen ist / deine Entscheidung braucht

1. **Phase 4 Deploy** (braucht ANPA-Zugang): Directus als CMS aufsetzen,
   Pocketbase + Directus als Container auf dem Docker-Host, Apache `ProxyPass`
   fuer `api.`/`cms.`-Subdomains, additives rsync des statischen Builds. Ist
   ausserdem outward-facing, daher bewusst nicht autonom gemacht.
2. **Mollie- und Stripe-Testkonten**: Sobald vorhanden, Keys als PB-Env setzen
   (`SHOP_MOLLIE_API_KEY`, `SHOP_STRIPE_SECRET_KEY`, `SHOP_STRIPE_WEBHOOK_SECRET`)
   und `shop_settings.active_provider` auf `mollie`/`stripe`/`both` stellen.
   `SHOP_QR_SECRET` fuer die Ticket-Signatur in Produktion setzen.
3. **SMTP** (ANPA): fuer OTP-Login-Mails und Bestaetigungs-Mails. In der PB-
   Admin-UI unter Mail-Settings konfigurieren.
4. **Native Kamera (App)**: Der Web-Kamera-Scanner auf `/scan` ist da
   (`@zxing/browser`, gehaertet nach Review). Fuer die Capacitor-App folgt noch
   `@capacitor-mlkit/barcode-scanning` fuer nativen Scan.
5. **Legacy-Module zurueckportieren**: `apps/web/legacy/` enthaelt die bisherigen
   Supabase-Seiten (community, crew, admin, wall, friendships, feedback). Sie sind
   aus dem Build genommen und werden modulweise auf Pocketbase portiert.

## Git

Initialer Commit + Kamera-Scanner-Commit liegen auf `master` (lokal, noch nicht
gepusht). Ein Remote (ANPA Gitea oder GitHub) kann bei Bedarf angebunden werden.
