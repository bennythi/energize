# Energize Festival — Handoff-Paket

Stand: 2026-06-19

Dieses Dokument enthaelt alles, was du auf einem neuen Rechner brauchst, um am
Energize Festival 2027 Projekt weiterzuarbeiten. Nutze es als erste Referenz
fuer Claude, wenn du in einer neuen Session bei Null anfaengst.

---

## 1. Projekt-Kontext

**Was ist das?** Web + iOS/Android Monorepo fuer das Energize Festival 2027
(Hardstyle-Festival, 29. Mai 2027, Stockelsdorf/Dissau bei Luebeck).

- **Veranstalter**: Brainchildz Event GmbH, vertreten durch Mikel Wardenga
  - Grapengiesserstr. 34b, 23556 Luebeck
  - HRB 17424 HL, USt-ID DE315777819
  - Kontakt: ticketing@energize-festival.de
- **Rolle**: Benjamin "Benny" Thiel entwickelt Web + Apps, Founder-Admin-Account
- **Live-URL**: https://energize.blackout42.de (Demo-Domain bis DNS-Cutover)
- **Ziel-Domain**: energize-festival.de (kurz vor Festival)
- **GitHub**: https://github.com/bennythi/energize (public)

## 2. Tech-Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: SvelteKit 2 + Svelte 5 (Runes), adapter-static
- **Styling**: Tailwind v4 beta + Design Tokens (`packages/design-tokens`)
- **Apps**: iOS/Android via Capacitor 6 (noch nicht initialisiert)
- **CMS**: Sanity Cloud (Project `oxliq7rf`, Dataset `production`)
- **DB/Auth/Storage**: Supabase (Project-Ref `zmazyriysvintuwlyzfm`, Region Frankfurt)
- **i18n**: Paraglide-JS (DE/EN), aber Crew-Bereich intentional nur DE
- **Analytics**: Plausible self-hosted (geplant auf plausible.blackout24.de)
- **Error-Monitoring**: Sentry Free Tier (Projekt anlegen, DSN in .env)

## 3. Setup auf neuem Rechner (Windows)

### 3.1 Tools installieren

```powershell
# Node 22 (via nvm-windows oder direkter Download)
# https://github.com/coreybutler/nvm-windows
nvm install 22.11.0
nvm use 22.11.0

# pnpm via corepack (Node 22 hat corepack builtin)
corepack enable
corepack prepare pnpm@9.15.0 --activate

# Git (kommt meist eh vorinstalliert)
git --version
```

### 3.2 Repo entpacken und Dependencies installieren

```powershell
# Zip entpacken nach z. B. E:\Code\energize
cd E:\Code\energize
pnpm install

# Erwartete Zeit: 1 bis 2 Minuten
```

### 3.3 Environment-Variablen anlegen

`apps/web/.env` (aus `.env.example` kopieren, dann Werte eintragen):

```env
# Sanity Cloud (public)
PUBLIC_SANITY_PROJECT_ID=oxliq7rf
PUBLIC_SANITY_DATASET=production

# Supabase (public, RLS schuetzt die Daten)
PUBLIC_SUPABASE_URL=https://zmazyriysvintuwlyzfm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<im Supabase-Dashboard → Settings → API → Publishable-Key>

# Sentry (optional, leer lassen bis Projekt angelegt)
PUBLIC_SENTRY_DSN=
```

`apps/studio/.env.local` (fuer Sanity Studio Seed-Scripts):

```env
SANITY_AUTH_TOKEN=<im Sanity-Dashboard → API → Tokens → Editor-Token erstellen>
```

### 3.4 SSH-Keys fuer Deploy

Fuer den manuellen Deploy auf den ANPA-Server brauchst du deinen SSH-Key.
Wenn du den vom alten Rechner mitnimmst, ins Verzeichnis `%USERPROFILE%\.ssh\`
kopieren, sonst neu generieren und Public-Key auf ANPA anlegen:

```powershell
# Neuen Key generieren
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -C "benny@laptop"

# Public-Key auf ANPA hinterlegen (einmalig, braucht altes Passwort)
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh -p 64022 benjamin_thielupload@web.anpa-networks.de "cat >> ~/.ssh/authorized_keys"

# Test
ssh -p 64022 benjamin_thielupload@web.anpa-networks.de "hostname"
```

### 3.5 Sanity-Login (fuer Studio)

```powershell
cd apps/studio
pnpm sanity login
# Waehle "Github", verknuepft mit bennythi-Account
```

## 4. Server- und Service-Zugaenge

Passwoerter/Secrets liegen NICHT in diesem Handoff. Alles aus dem
Passwort-Manager (Bitwarden/1Password) holen.

### 4.1 ANPA (Live-Webserver fuer Energize)

- **Host**: `web.anpa-networks.de`
- **SSH-Port**: `64022`
- **User**: `benjamin_thielupload` (System-User `web102`)
- **DocumentRoot**: `~/web/` (= `/var/www/clients/client7/web102/web`)
- **Docroot ist Subdomain-Root** von `energize.blackout42.de`
- **Node**: 20.20.2 (nicht 22, dort nur Sicherheitsnetz falls Server-Node noetig)
- **rsync**: 3.2.7
- **TLS**: Let's Encrypt, vom ANPA-Admin verwaltet

### 4.2 Portainer (Docker fuer Plausible/Sentry-Alternative)

- **URL**: `portainer.anpa-networks.de`
- **User**: `benjamin.thiel` (mit Punkt, nicht Unterstrich)
- **Passwort**: aus Passwort-Manager
- **Verwendung**: geplant fuer Plausible-Analytics auf `plausible.blackout24.de`

### 4.3 Blackout42 (Jukebox, separates Projekt)

- **URL**: `blackout42.de` (bzw. Subdomain via `blackout24.de`)
- **Frontend-SSH-User**: `benjamin_thieljukebox_upload` (mit Unterstrich!)
- **Docroot**: `web105`
- **SSH-Key**: `jukebox_deploy_ed25519`
- **Backend**: via Portainer

### 4.4 Supabase

- **Project-Ref**: `zmazyriysvintuwlyzfm`
- **Region**: Frankfurt (eu-central-1)
- **Tarif**: Free (Upgrade auf Pro kurz vor Festival geplant)
- **URL zum Dashboard**: https://supabase.com/dashboard/project/zmazyriysvintuwlyzfm
- **SQL-Editor**: dort Migrationen aus `supabase/migrations/` einzeln laufen lassen
- **Founder-Account** (im Code hardcoded): `benjamin.thiel@outlook.com`

### 4.5 Sanity

- **Project-ID**: `oxliq7rf`
- **Dataset**: `production`
- **Studio**: `pnpm --filter @energize/studio dev` (localhost:3333)
- **Alternativ**: Sanity Cloud unter `*.sanity.studio`
- **CORS**: `https://energize.blackout42.de` und `http://localhost:5173` freigegeben

### 4.6 GitHub

- **Repo**: `github.com/bennythi/energize` (public)
- **Push zu main**: direkt, keine PR-Pflicht (aendern wenn Team groesser wird)
- **Actions**:
  - CI (Lint + Typecheck + Build) laeuft bei jedem Push
  - Deploy laeuft nur wenn `vars.DEPLOY_ENABLED=true` gesetzt ist
- **Secrets fuer Deploy** (siehe `docs/deploy-workflow.md`):
  - `ANPA_SSH_KEY`, `ANPA_KNOWN_HOSTS`, `ANPA_PORT=64022`,
    `ANPA_USER=benjamin_thielupload`, `ANPA_HOST=web.anpa-networks.de`,
    `ANPA_TARGET=web/`

## 5. Wichtige Kommandos

### Lokale Entwicklung

```powershell
pnpm --filter @energize/web dev       # localhost:5173
pnpm --filter @energize/studio dev    # localhost:3333 (Sanity Studio)
```

### Typecheck / Lint / Build

```powershell
pnpm turbo run typecheck              # alle Pakete
pnpm turbo run lint                   # alle Pakete
pnpm --filter @energize/web build     # nur Web-Build
```

### Manuelles Deploy (kein Auto-Deploy aktiv, siehe HANDOFF Punkt 4.6)

```powershell
cd E:\Code\energize
pnpm --filter @energize/web build
tar czf build.tar.gz -C apps/web/build .
scp -P 64022 build.tar.gz benjamin_thielupload@web.anpa-networks.de:web/build.tar.gz
ssh -p 64022 benjamin_thielupload@web.anpa-networks.de "cd web && tar xzf build.tar.gz && rm build.tar.gz"
Remove-Item build.tar.gz
```

### Verifikation

```powershell
curl.exe -s https://energize.blackout42.de/ | findstr "app\."
```

## 6. Aktueller Stand (Stand 2026-06-19)

### Live deployed

- Web-App auf `energize.blackout42.de` (adapter-static, Apache mit MultiViews)
- CSP-Header, HSTS, X-Frame-Options aktiv (in `.htaccess`)
- Migrations 0001-0011 sicher gelaufen (Support-System, Sicherheits-Hardening)
- Neuer Build vom User zuletzt am 2026-06-19 deployed

### Committed lokal, ggf. noch nicht auf origin/main

Pruef mit:

```powershell
git log --oneline origin/main..HEAD
```

Falls Commits ausstehen: `git push origin main` und CI beobachten.

### Migrationen die noch NICHT in Supabase gelaufen sind

Pro File pruefen:

- Ab `0012_avatars.sql` (Profilbild-Storage)
- `0013_crew.sql` (Crew-Bereich)
- `0014_crew_independent_flag.sql` (is_crew getrennt von role)
- `0015_cashless_kasse.sql` (Cashless-Abrechnung)
- `0016_crew_briefings.sql`
- `0017_crew_milestones.sql`
- `0018_crew_permissions.sql` (granulare Permissions)
- `0019_admin_view_as.sql` (Admin kann als User sehen)
- `0020_friendships.sql` (Freundschafts-Feature mit Mail-Queue)

### Bekannte offene Themen

1. **Mail-Versand**: `outbound_emails` sammelt sich an, Edge Function fuer
   SMTP-Versand ist noch nicht deployed. Betrifft: Support-Antworten,
   Freundschaftsanfragen.
2. **Plausible**: docker-compose steht in `docker/plausible/`, aber noch nicht
   auf Portainer-Server deployed. DNS `plausible.blackout24.de` noch nicht gesetzt.
3. **Sentry**: SDK integriert, DSN in `.env` fehlt noch. Free-Tier-Projekt anlegen.
4. **Capacitor iOS/Android**: `apps/app/` existiert nur als SvelteKit-Zwilling.
   `npx cap add ios` und `android` steht aus.
5. **Auto-Deploy**: `vars.DEPLOY_ENABLED` in GitHub Actions Variables nicht
   gesetzt. Solange manuell deployen.

## 7. Wichtige User-Praeferenzen fuer Claude

Diese Regeln sollten in der neuen Session gelten:

- **Keine Em-Dashes**: der User will nicht dass Texte nach KI aussehen. Punkte,
  Doppelpunkte, Kommas nutzen. Gilt fuer UI-Strings, Kommentare, Commit-Messages.
- **Umlaute schreiben**: in UI-Texten immer ue/oe/ae/ss vermeiden, echte
  Umlaute nutzen (ue → ü, oe → ö, ae → ä, ss → ß). Ausnahme: Code-Kommentare
  in Datenbank-Migrationen (dort ASCII, weil DB-Encoding).
- **PowerShell 5.1**: kein `&&` Chaining, stattdessen `;` oder `if ($?)`.
- **SvelteKit env**: NIE `import.meta.env.PUBLIC_*` benutzen (bricht),
  stattdessen `$env/static/public` oder `$env/dynamic/public`.
- **Crew-Bereich Deutsch-only**: keine i18n-Integration, alle Strings hardcoded.
- **Rechte-System**: Crew ohne explizite Permission sieht nichts ausser
  Dashboard mit Hinweis. Admin hat immer alles. Konfiguriert unter
  `/admin/berechtigungen`.

## 8. Weiteres Kontext

- `README.md` — allgemeiner Ueberblick
- `docs/anpa-deploy.md` — ausfuehrliche Deploy-Doku
- `docs/community-setup.md` — Storage/RLS/Moderation
- `docs/supabase-setup.md` — Auth-Konfig
- `docs/supabase-email-templates/` — HTML-Templates fuer Auth-Mails
- `supabase/migrations/` — alle SQL-Migrationen in Reihenfolge
- `packages/design-tokens/` — Farb-Palette, Font-Stack (Barlow Condensed + Inter + JetBrains Mono)

## 9. Fuer Claude auf dem neuen Rechner

Wenn Claude die Session neu startet:

1. Diese HANDOFF.md komplett lesen
2. `README.md` lesen
3. `git status` und `git log --oneline -10` fuer aktuellen Stand
4. Bei neuen Features: erst Memory-Regeln in Punkt 7 checken, dann implementieren
5. Bei DB-Aenderungen: neue Migration mit fortlaufender Nummer, User laesst sie
   manuell im Supabase SQL-Editor laufen
6. Vor jedem Commit: `pnpm turbo run typecheck` und `pnpm turbo run lint` gruen

Zusatz-Memory fuer Claude (aus vorherigen Sessions):

- User ist Benjamin "Benny" Thiel, Founder von Brainchildz Event
- Programmiert Web + Apps solo, freut sich ueber pragmatische Vorschlaege
- Prefers additive Deploys ueber destruktive rsync --delete
- Nutzt Windows PowerShell 5.1, kein WSL
- Repo aktuell auf `E:\Code\energize\`

---

Bei Problemen: die `docs/`-Ordner und `MEMORY.md` im Claude-Verzeichnis
(`~/.claude/projects/*/memory/`) sind die primaeren Referenzen.
