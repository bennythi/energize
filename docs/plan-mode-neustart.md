# Energize Festival 2027 — Plan-Mode-Spezifikation (Neustart)

> Dieses Dokument wird Claude Code im Plan-Modus übergeben.
> Es enthält alle Anforderungen, Stack-Entscheidungen und
> Architektur-Vorgaben für einen kompletten Neubau des Projekts.
> Bitte erst vollständig lesen, dann einen Implementierungsplan erstellen.

---

## 1. Projektkontext

**Was entsteht hier?**
Offizielle Web-App + iOS/Android-App für das Energize Festival 2027,
gleichzeitig das Pilotprojekt einer wiederverwendbaren Event-Plattform.

- Hardstyle-Festival, 29. Mai 2027, Stockelsdorf/Dissau bei Lübeck
- Veranstalter: Brainchildz Event GmbH
- **Entwicklungsteam**: Benjamin Thiel + Mikel Wardenga
- Energize ist das erste Kundenprojekt auf der Plattform und dient als
  Proof of Concept für weitere Veranstaltungen/Kunden

**Was es leisten muss:**

- Öffentliche Marketing-Website (Lineup, FAQ, Anfahrt, Ticketing-Link)
- Benutzer-Accounts mit Magic-Link-Login (kein Passwort)
- Crew-Bereich (intern, nur deutsch): Kalender, Briefings, Meilensteine, Berechtigungen, Funkgeräte
- Admin-Bereich: User-Verwaltung, Moderation, Support-Tickets, Cashless-Abrechnung
- Community: öffentliche Profile, Freundschaften, Foto-Wall
- Cashless-Anbindung (später Phase)
- iOS + Android App via Capacitor (gleiche SvelteKit-Codebase)
- Push-Notifications, Set-Reminder (spätere Phase)
- Karte mit POIs (SVG, offline-fähig)

**Produktstrategie: Modulares Event-Platform-Produkt**
Das Projekt ist nicht nur die Energize-App. Es ist die erste Instanz
einer wiederverwendbaren Event-Plattform. Einzelne Module können pro
Kunde/Event aktiviert oder deaktiviert werden. Ziel ist es, anderen
Veranstaltern dieselbe Plattform mit ihrem Branding und ihrer
Modul-Auswahl anbieten zu können.

---

## 2. Grundprinzipien

- **Europäisch first**: Kein Dienst von US-Unternehmen, wo eine gleichwertige
  europäische oder open-source Alternative existiert.
- **Self-hosted first**: Alles was sinnvoll selbst betrieben werden kann,
  wird selbst betrieben. Keine Vendor-Lock-ins.
- **Kostenminimiert**: Ziel ist ein Betrieb unter 20€/Monat bis zum Festival.
- **Wartbar**: Zwei Entwickler müssen das Projekt verstehen und weiterentwickeln.
- **Kein Over-Engineering**: Kein Microservices-Theater. Monorepo, klare Grenzen.
- **Modular**: Features werden als abschaltbare Module gebaut. Kein Modul
  ist fest verdrahtet. Neue Kunden bekommen eine Instanz mit ihrer Modul-Auswahl.

---

## 3. Tech-Stack

### 3.1 Frontend / App

| Technologie     | Entscheidung                        | Begründung                                                     |
| --------------- | ----------------------------------- | -------------------------------------------------------------- |
| Framework       | **SvelteKit 2 + Svelte 5 (Runes)**  | Exzellente Performance, kleine Bundle-Größe, Runes sind stabil |
| Styling         | **Tailwind CSS v4 + Design Tokens** | Utility-first, eigenes Token-System für Brand-Konsistenz       |
| i18n            | **Paraglide-JS**                    | Typsicher, tree-shakeable, DE + EN (Crew-Bereich nur DE)       |
| Native App      | **Capacitor 6**                     | Eine SvelteKit-Codebase → iOS + Android, ~90% Code-Sharing     |
| Build           | **Vite**                            | Standard in SvelteKit-Ökosystem                                |
| Package Manager | **pnpm 9 + Turborepo**              | Monorepo-Workspaces, schnelle Installs                         |

### 3.2 Backend (Supabase-Ersatz, selbst betrieben)

**Primär: Pocketbase**

Pocketbase ist ein Open-Source-Backend in einem einzigen Go-Binary.
Es ersetzt Supabase vollständig:

| Supabase-Feature       | Pocketbase-Äquivalent                                   |
| ---------------------- | ------------------------------------------------------- |
| PostgreSQL             | Eingebettetes SQLite (oder ext. Postgres via Plugin)    |
| Auth (Magic Link, JWT) | Eingebaut, SMTP-konfiguierbar                           |
| Row Level Security     | Collection-Rules (pro Collection, pro Aktion)           |
| Storage                | Eingebaut (lokales Dateisystem oder S3-kompatibel)      |
| Realtime               | Server-Sent Events (eingebaut)                          |
| Admin UI               | Eingebaut unter `/\_/`                                  |
| Edge Functions         | Entfällt; SvelteKit Server-Routes übernehmen Logik      |
| Database Webhooks      | Hooks (beforeCreate, afterCreate etc. in Go-Extensions) |

**Vorteile gegenüber Supabase:**

- Single binary, läuft auf dem kleinsten Hetzner-VPS
- Keine Abhängigkeit von einem SaaS
- Tschechischer Entwickler (Gani Georgiev), MIT-Lizenz
- Keine Pausing bei Inaktivität (Free-Tier-Problem von Supabase entfällt)
- Einfachere Backup-Strategie (SQLite = eine Datei)

**Einschränkungen vs. Supabase:**

- Kein natives SQL (Collection-basiertes Datenmodell)
- Kein vollständiges PostgreSQL-Ökosystem
- Für komplexe Abfragen: Pocketbase-SDK oder REST-API

> **Alternative falls relationales Schema zwingend nötig:**
> PostgreSQL (in Docker auf Hetzner) + Drizzle ORM +
> Hono-API auf Bun. Aufwändiger, aber vollständig SQL-basiert.
> Entscheidung im Plan-Modus treffen.

### 3.3 CMS (Sanity-Ersatz)

**Directus** (selbst betrieben)

- Niederländisches Unternehmen, vollständig open source (BSL-Lizenz, self-hosted kostenlos)
- Datenbank-First CMS: legt Content direkt in Postgres/SQLite ab
- REST + GraphQL API
- Exzellente Admin-Oberfläche für Content-Redakteure
- Ersetzt Sanity für: Lineup, FAQ, POIs, Sponsoren, News

> **Alternative:** Payload CMS (MIT, self-hosted) — TypeScript-nativer,
> besser für Entwickler, weniger ausgereiftes Redakteurs-UI.

### 3.4 Infrastruktur

| Dienst       | Anbieter                                               | Kosten              |
| ------------ | ------------------------------------------------------ | ------------------- |
| Webserver    | **ANPA Networks** (bestehend, Shared Hosting, deutsch) | bestehender Vertrag |
| SSH-Deploy   | `benjamin_thielupload@web.anpa-networks.de` Port 64022 | —                   |
| DocumentRoot | `~/web/` (Subdomain via Apache MultiViews)             | —                   |
| TLS          | Let's Encrypt, vom ANPA-Admin verwaltet                | kostenlos           |
| Domain       | energize-festival.de (DNS nach Festival-Cutover)       | bestehend           |
| Backup       | ANPA-eigene Backups + lokales Snapshot-Skript          | bestehend           |

Kein eigener VPS nötig. Alles läuft auf ANPA:

- Statisches SvelteKit-Build via Apache (bestehend)
- Pocketbase als dauerhafter Prozess (bestätigt von ANPA)
- Directus als dauerhafter Prozess (bestätigt von ANPA)
- Plausible CE (bestätigt von ANPA)
- GlitchTip optional (bestätigt von ANPA)
- Apache ProxyPass für `api.`- und `cms.`-Subdomains (bestätigt von ANPA)
- SMTP-Versand über ANPA-Mailserver (bestätigt von ANPA)
- Gitea + Gitea Actions Runner (bestätigt von ANPA)

### 3.5 Git + CI/CD

| Dienst      | Anbieter                               | Begründung                                          |
| ----------- | -------------------------------------- | --------------------------------------------------- |
| Git-Hosting | **ANPA Gitea** (self-hosted, deutsch)  | Alles auf einer Plattform, kein externer Dienst     |
| CI/CD       | **Gitea Actions** (eingebaut in Gitea) | GitHub-Actions-kompatible Syntax, keine extra Tools |

Deploy-Workflow:

- Push zu ANPA Gitea `main` triggert Gitea Actions
- Action baut das SvelteKit-Frontend (pnpm + turbo)
- rsync (additiv, ohne `--delete`) via SSH-Key direkt zu ANPA `~/web/`

### 3.6 Mail

ANPA stellt SMTP zur Verfügung. Kein externer Mail-Dienst nötig.

| Zweck                                                      | Lösung                              |
| ---------------------------------------------------------- | ----------------------------------- |
| Transaktionale Mails (Magic Link, Freundschaften, Support) | **ANPA SMTP** (bestehender Account) |

Pocketbase wird mit ANPA-SMTP-Zugangsdaten konfiguriert:

```env
PB_SMTP_HOST=<anpa-smtp-host>
PB_SMTP_PORT=587
PB_SMTP_USERNAME=<anpa-mail-user>
PB_SMTP_PASSWORD=<aus Passwort-Manager>
PB_SMTP_FROM=noreply@energize-festival.de
```

Zugangsdaten aus Bitwarden/1Password holen.

### 3.7 Analytics + Monitoring

| Dienst           | Lösung                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| Web-Analytics    | **Plausible CE** (Community Edition, estnisch/britisch, self-hosted kostenlos) |
| Error-Monitoring | **GlitchTip** (Sentry-Alternative, open source, MIT, self-hosted)              |

---

## 4. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    ANPA Networks (Webserver)                 │
│                    web.anpa-networks.de :64022 SSH           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Apache (bestehend, MultiViews, .htaccess)           │   │
│  │  ~/web/ → energize-festival.de (statisches Build)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────┐   ┌──────────────────┐                   │
│  │  Pocketbase   │   │    Directus      │                   │
│  │  :8090        │   │    :8055         │                   │
│  │  Auth+DB      │   │  Lineup, FAQ etc │                   │
│  │  Storage      │   └──────────────────┘                   │
│  │  Realtime     │                                          │
│  │  (Go-Binary,  │   ┌──────────────────┐                   │
│  │   kein Root)  │   │    Plausible CE  │                   │
│  └───────────────┘   │    :8000         │                   │
│                      └──────────────────┘                   │
│                                                             │
│  SMTP: ANPA-Mailserver (fuer Magic Links, Benachrichtigungen)│
└─────────────────────────────────────────────────────────────┘
        │ rsync (additiv, SSH Port 64022)
        │ via Gitea Actions (ANPA Gitea)
        ▼
┌───────────────────────────────────────────────┐
│         ANPA Gitea (self-hosted, deutsch)      │
│         + Gitea Actions (Build + Deploy)       │
└───────────────────────────────────────────────┘

Domains:
  energize-festival.de      → Public Website + User-Bereich
  energize-festival.de/crew → Crew-Bereich
  energize-festival.de/admin → Admin-Bereich
  api.energize-festival.de  → Pocketbase
  cms.energize-festival.de  → Directus-UI
        │
        ▼
┌───────────────────┐    ┌───────────────────┐
│  iOS App          │    │  Android App      │
│  (Capacitor)      │    │  (Capacitor)      │
└───────────────────┘    └───────────────────┘
```

---

## 5. Monorepo-Struktur

```
energize/
├── apps/
│   ├── web/              — SvelteKit Marketing + User-App (adapter-static)
│   ├── app/              — SvelteKit + Capacitor (adapter-static)
│   └── cms/              — Directus-Konfiguration (schema, extensions)
├── packages/
│   ├── design-tokens/    — Brand-Farben, Typo, Spacing → CSS-Vars + Tailwind
│   ├── ui/               — Geteilte Svelte-5-Komponenten
│   ├── i18n/             — Paraglide-Setup (DE + EN)
│   ├── pb-types/         — Generierte Pocketbase-TypeScript-Typen
│   └── tsconfig/         — Geteilte tsconfigs
├── infra/
│   ├── caddy/            — Caddyfile
│   ├── coolify/          — Coolify-Compose-Dateien
│   ├── pocketbase/       — pb_migrations/, pb_hooks/ (Go-Extensions)
│   └── plausible/        — docker-compose.yml
├── .woodpecker/          — CI/CD-Pipelines (Woodpecker)
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md
```

---

## 6. Feature-Anforderungen

### 6.1 Öffentlicher Bereich (kein Login nötig)

- **Home**: Hero, Countdown zum Festival, Key-Facts, CTA zu Tickets
- **Lineup**: Künstler-Grid mit Stages/Zeiten (aus Directus)
- **FAQ**: Accordion (aus Directus)
- **Anfahrt**: Karte (Leaflet.js, OpenStreetMap), ÖPNV-Info
- **Background**: Über Brainchildz / Geschichte des Festivals
- **Media**: Foto-Galerie, Video-Einbettung (kein YouTube = Datenschutz,
  stattdessen eigene Videos via Hetzner Storage)
- **Datenschutz / AGB / Impressum**: statische Seiten
- **Ticketing-Link**: Weiterleitung zu Tickee (Drittanbieter, bleibt extern)

### 6.2 User-Accounts

- **Registrierung + Login**: Magic Link (OTP via E-Mail, kein Passwort)
- **Profil**: Anzeigename, Handle, Avatar (Upload zu Pocketbase Storage)
- **Account-Einstellungen**: E-Mail ändern, Account löschen
- **Support-Tickets**: User kann Ticket erstellen, Admin antwortet
- **Freundschaften**: Anfrage senden/annehmen/ablehnen, Liste, Status
- **Community-Karte**: Opt-in, Herkunftsort auf Festival-Karte

### 6.3 Crew-Bereich (nur DE, nur eingeloggte Crew)

- **Dashboard**: Persönliche Übersicht, offene Aufgaben
- **Kalender**: Monatsansicht mit Crew-Events
- **Briefings**: Dokumente mit Versionierung
- **Meilensteine**: Fortschritts-Tracking
- **Funkgeräte-Bestellung**: Bestellformular
- **Cashless-Kassen**: Abrechnung für Kassierer
- **Berechtigungen**: Admin vergibt granulare Rechte pro Ressource

### 6.4 Admin-Bereich

- **User-Verwaltung**: Liste, Suche, Account-Aktionen
- **Crew-Verwaltung**: is_crew-Flag, Rollen, Permissions vergeben
- **Moderation**: Community-Posts moderieren
- **Support**: Tickets einsehen + beantworten (triggert Mail)
- **View-As**: Als beliebiger User die App sehen (Debugging)
- **Tools**: DB-Snapshots anstoßen, Cache leeren

### 6.5 Berechtigungs-System

- `role`: `user` | `crew` | `admin`
- `is_crew`: separates Flag (Crew-Zugang ohne Admin)
- Granulare Permissions pro Ressource: `read` | `write` | `delete`
- Crew ohne explizite Permission: sieht nur Dashboard mit Hinweis
- Admin hat immer alle Rechte

---

## 7. Modul-Architektur

### 7.1 Konzept

Die Plattform besteht aus einem unveränderlichen **Kern** und optionalen
**Modulen**. Jedes Modul kann pro Instanz/Kunde via Konfiguration
aktiviert oder deaktiviert werden, ohne Code zu ändern.

Ein neuer Kunde bekommt:

- Eine eigene Pocketbase-Instanz (eigene Daten, eigene Subdomain)
- Eigenes Branding (Design Tokens: Farben, Logo, Schrift)
- Seine Modul-Auswahl in `modules.config.ts`

### 7.2 Modul-Übersicht

| Modul               | Slug              | Energize  | Wiederverwendbar | Beschreibung                                           |
| ------------------- | ----------------- | :-------: | :--------------: | ------------------------------------------------------ |
| Öffentliche Website | `public-site`     |    ✅     |        ✅        | Home, Lineup, FAQ, Anfahrt, Ticketing-Link             |
| User-Accounts       | `accounts`        |    ✅     |        ✅        | Magic Link, Profil, Avatar                             |
| Support-Tickets     | `support`         |    ✅     |        ✅        | User schreibt, Admin antwortet                         |
| Community           | `community`       |    ✅     |        ✅        | Öffentliche Profile, Community-Karte                   |
| Freundschaften      | `friendships`     |    ✅     |        ✅        | Anfrage, Bestätigung, Mail                             |
| Foto-Wall           | `photo-wall`      |    ✅     |        ✅        | Upload, Moderation, Galerie                            |
| Festival-Karte      | `map`             |    ✅     |        ✅        | SVG-Karte mit POIs, offline-fähig                      |
| Crew-Basis          | `crew-core`       |    ✅     |        ✅        | Dashboard, Kalender, Berechtigungen                    |
| Crew-Briefings      | `crew-briefings`  |    ✅     |        ✅        | Dokumente mit Versionierung                            |
| Crew-Meilensteine   | `crew-milestones` |    ✅     |        ✅        | Fortschritts-Tracking                                  |
| Cashless-Kassen     | `cashless`        |    ✅     |        ✅        | Abrechnung für Kassierer                               |
| Funkgeräte          | `crew-radio`      |    ✅     |        ❌        | Bestellformular für Ehrenamtliche, Energize-spezifisch |
| Push-Notifications  | `push`            | (geplant) |        ✅        | Web-Push + App-Push via Capacitor                      |
| Set-Reminder        | `set-reminder`    | (geplant) |        ✅        | Künstler-Auftritt vormerken                            |

### 7.3 Technische Umsetzung

**Zentrale Modul-Konfiguration** pro Instanz:

```typescript
// packages/modules/src/config.ts
export interface ModuleConfig {
  'public-site': boolean;
  accounts: boolean;
  support: boolean;
  community: boolean;
  friendships: boolean;
  'photo-wall': boolean;
  map: boolean;
  'crew-core': boolean;
  'crew-briefings': boolean;
  'crew-milestones': boolean;
  cashless: boolean;
  'crew-radio': boolean;
  push: boolean;
  'set-reminder': boolean;
}
```

**Instanz-Konfiguration** (eine Datei pro Kunde/Deployment):

```typescript
// apps/web/src/lib/instance.config.ts  (nicht im Kern-Repo)
import type { ModuleConfig } from '@eventplatform/modules';

export const modules: ModuleConfig = {
  'public-site': true,
  accounts: true,
  support: true,
  community: true,
  friendships: true,
  'photo-wall': true,
  map: true,
  'crew-core': true,
  'crew-briefings': true,
  'crew-milestones': true,
  cashless: true,
  'crew-radio': true, // nur Energize
  push: false,
  'set-reminder': false,
};
```

**Routing**: SvelteKit-Routen für deaktivierte Module geben 404 zurück.
Die Navigation blendet Links zu deaktivierten Modulen automatisch aus.

**Pocketbase**: Collections für deaktivierte Module werden nicht
angelegt (Migration prüft `modules`-Config vor der Ausführung).

### 7.4 Instanz-Struktur (Monorepo-Ebene)

```
eventplatform/          ← Name des Kern-Repos (nicht "energize")
├── packages/
│   ├── modules/        ← Modul-Typen, Helper, ModuleGuard-Komponente
│   ├── design-tokens/  ← Default-Tokens (werden pro Instanz überschrieben)
│   ├── ui/             ← Kern-Komponenten (modul-unabhängig)
│   └── ...
├── apps/
│   └── web/            ← Kern-App (enthält ALLE Module als Code)
└── instances/
    ├── energize/       ← instance.config.ts + Design-Tokens + Assets
    └── kunde-b/        ← instance.config.ts + Design-Tokens + Assets
```

Beim Build wird die Instanz-Konfiguration injiziert:

```powershell
INSTANCE=energize pnpm --filter @eventplatform/web build
```

### 7.5 Branding pro Instanz

Jede Instanz überschreibt die Design-Tokens:

```css
/* instances/energize/tokens.css */
:root {
  --color-brand: #f5c400; /* Energize Gelb */
  --color-bg: #0a0a0a;
  --font-display: 'Barlow Condensed';
}
```

```css
/* instances/kunde-b/tokens.css */
:root {
  --color-brand: #e63946; /* Kunde B Rot */
  --color-bg: #ffffff;
  --font-display: 'Inter';
}
```

---

## 8. Datenschema (Pocketbase Collections)

Pocketbase nutzt Collections statt SQL-Tabellen.
RLS wird durch Collection-Rules ersetzt (per-collection, per-action Ausdrücke).

### Pflicht-Collections

```
profiles           — Erweiterung des PB-Users (handle, display_name, avatar, is_crew, role)
support_tickets    — Support-Anfragen mit Status-Enum
support_replies    — Antworten zu Tickets
outbound_emails    — Mail-Queue (Pocketbase-Hook feuert Versand)
crew_briefings     — Briefing-Dokumente mit Version
crew_milestones    — Meilensteine mit Fälligkeitsdatum
crew_permissions   — Resource-Slug + Level pro User
cashless_kassen    — Kassen-Datensätze für Abrechnung
friendships        — Bidirektional (user_low, user_high, requester, status)
community_posts    — Foto-Wall-Einträge mit Moderation-Status
```

---

## 9. Migrations- und Datenschema-Strategie

Da kein SQL/Supabase mehr genutzt wird:

- Pocketbase-Schema wird über `pb_migrations/`-JS-Dateien versioniert
- Migrationen laufen automatisch beim PB-Start
- Kein manuelles SQL-Editor-Workflow mehr nötig
- Typen werden via `pocketbase-typegen` aus der laufenden Instanz generiert
  und als `packages/pb-types/` im Monorepo committed

---

## 10. Auth-Flow (Magic Link ohne Supabase)

```
1. User gibt E-Mail ein
2. SvelteKit ruft PocketBase Auth-API auf:
   POST /api/collections/users/auth-with-otp
   → PB generiert OTP + versendet Mail via SMTP (Brevo)
3. User klickt Link → /auth/callback?token=...
4. SvelteKit tauscht Token gegen JWT aus:
   POST /api/collections/users/confirm-otp
5. JWT wird im localStorage gespeichert (PB-SDK übernimmt das)
6. Realtime-Subscription refresht automatisch
```

---

## 11. E-Mail-Versand

Pocketbase hat eingebauten SMTP-Support.
Konfiguration via Admin-UI oder Environment-Variablen:

```env
PB_SMTP_HOST=smtp-relay.brevo.com
PB_SMTP_PORT=587
PB_SMTP_USERNAME=<brevo-login>
PB_SMTP_PASSWORD=<brevo-api-key>
PB_SMTP_FROM=noreply@energize-festival.de
```

Zusätzliche Hooks in `pb_hooks/` für:

- Freundschafts-Mails (on friendship accepted)
- Support-Antwort-Mails (on support reply created)

---

## 12. Deployment-Workflow

```
git push anpa-gitea main
      │
      ▼
Gitea Actions Pipeline (.gitea/workflows/deploy.yml):
  1. pnpm install
  2. turbo typecheck + lint
  3. pnpm --filter @energize/web build
  4. rsync build/ → ANPA ~/web/
      (SSH Port 64022, additiv, ohne --delete, via Deploy-Key)
  └── Pocketbase und Directus laufen als dauerhafter Prozess
      auf ANPA, brauchen kein Re-Deploy bei Frontend-Änderungen
```

---

## 13. Umgebungsvariablen

### apps/web/.env

```env
# Pocketbase (public — RLS-Äquivalent via Collection-Rules)
PUBLIC_PB_URL=https://api.energize-festival.de

# Directus
PUBLIC_DIRECTUS_URL=https://cms.energize-festival.de

# Plausible
PUBLIC_PLAUSIBLE_DOMAIN=energize-festival.de
PUBLIC_PLAUSIBLE_URL=https://plausible.energize-festival.de

# GlitchTip (optional)
PUBLIC_SENTRY_DSN=
```

### infra/pocketbase/.env

```env
PB_SMTP_HOST=smtp-relay.brevo.com
PB_SMTP_PORT=587
PB_SMTP_USERNAME=
PB_SMTP_PASSWORD=
PB_SMTP_FROM=noreply@energize-festival.de
PB_ADMIN_EMAIL=benjamin.thiel@outlook.com
PB_ADMIN_PASSWORD=<aus Passwort-Manager>
```

---

## 14. Automatisierte Qualitätssicherung via Claude Agents

Regelmäßige Security- und Code-Quality-Checks laufen als Claude-Agent-Tasks,
nicht als manuelle Reviews.

### 14.1 Security-Check (wöchentlich)

Nach jedem größeren Feature-Merge oder mindestens einmal pro Woche:

```
/security-review
```

Prüft den aktuellen Diff auf:

- Injection-Schwachstellen (XSS, SQL, Command Injection)
- Unsichere Direktzugriffe auf Pocketbase ohne Collection-Rules
- Fehlende Auth-Guards auf Crew/Admin-Routen
- Exponierte Secrets oder Credentials im Code
- OWASP Top 10 im Kontext SvelteKit + Pocketbase

Findings werden als Inline-Kommentare oder als Issue im ANPA Gitea erfasst.

### 14.2 Code-Review (pro Feature-Branch)

```
/code-review
```

Vor jedem Merge in `main`:

- Correctness-Bugs
- Vereinfachungs- und Effizienz-Verbesserungen
- Modul-Isolation (kein Modul greift direkt in ein anderes)
- Einhaltung der Claude-Regeln (keine Em-Dashes, echte Umlaute etc.)

### 14.3 Dependency-Check (monatlich)

Claude Agent prüft `pnpm-lock.yaml` und Pocketbase-Version auf:

- Bekannte CVEs in direkten und transitiven Abhängigkeiten
- Veraltete Pakete mit Breaking Changes in der nächsten Hauptversion
- Europäische Alternativen zu neu hinzugekommenen US-Paketen

### 14.4 Modul-Integrität (bei neuem Modul)

Beim Hinzufügen eines neuen Moduls läuft ein Agent der prüft:

- Ist das Modul hinter `modules.config.ts` gated?
- Sind alle Routen durch Auth-Guards gesichert?
- Hat das Modul eigene Pocketbase-Collections ohne Seiteneffekte auf andere?
- Ist das Modul vollständig deaktivierbar ohne Laufzeitfehler?

---

## 15. Claude Skills

### 15.1 Repo-lokale Skills (in `.claude/skills/`, Teil des Repos)

Diese Skills liegen direkt im Repo und sind für alle Entwickler automatisch verfügbar.

| Skill             | Zweck                                                                | Wann nutzen                                           |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| `emil-design-eng` | UI-Polish, Animations-Regeln, unsichtbare Details nach Emil Kowalski | Vor jeder UI-Komponente: Spacing, Transitions, States |
| `frontend-design` | Produktionsreife Frontend-Interfaces, kein generisches KI-Aussehen   | Neue Seiten, Komponenten, Layout-Entscheidungen       |
| `senior-frontend` | SvelteKit-Patterns, Performance, State-Management, Bundle-Analyse    | Komplexe Feature-Implementierungen, Refactoring       |

### 15.2 Globale Skills (in `~/.claude/skills/`, pro Entwickler)

Jeder Entwickler installiert diese einmalig auf seinem Rechner:

```bash
claude skills install emil-design-eng   # Redundanz zu repo-lokal, für andere Projekte
claude skills install find-skills       # Skills entdecken wenn man nicht weiß welcher passt
```

### 15.3 Eingebaute Skills (kommen mit Claude Code, keine Installation nötig)

#### Qualitätssicherung (direkt relevant für Abschnitt 14)

| Skill           | Slash-Command      | Wann                                          |
| --------------- | ------------------ | --------------------------------------------- |
| Security-Review | `/security-review` | Wöchentlich, nach Feature-Merges              |
| Code-Review     | `/code-review`     | Vor jedem Merge in `main`                     |
| Simplify        | `/simplify`        | Nach größeren Features: Cleanup + Refactoring |
| Review (PR)     | `/review`          | Pull-Request-Review auf Gitea                 |

#### Entwicklung + Verifikation

| Skill  | Slash-Command | Wann                                                          |
| ------ | ------------- | ------------------------------------------------------------- |
| Run    | `/run`        | App starten und Screenshot für manuelle Verifikation          |
| Verify | `/verify`     | Bestätigen dass eine Änderung im Browser korrekt funktioniert |
| Init   | `/init`       | CLAUDE.md beim Projektstart initialisieren                    |

#### Recherche + Planung

| Skill         | Slash-Command    | Wann                                                                      |
| ------------- | ---------------- | ------------------------------------------------------------------------- |
| Deep Research | `/deep-research` | Technische Entscheidungen: Pocketbase vs. Postgres, Bibliotheksvergleiche |
| Claude API    | `/claude-api`    | Wenn KI-Features in die Plattform integriert werden sollen                |

#### Automatisierung + Konfiguration

| Skill                    | Slash-Command               | Wann                                                                      |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| Schedule                 | `/schedule`                 | Wiederkehrende Agent-Tasks einrichten (z.B. wöchentlicher Security-Check) |
| Loop                     | `/loop`                     | Einen Befehl auf Intervall laufen lassen                                  |
| Update Config            | `/update-config`            | `settings.json` anpassen, Hooks einrichten, Permissions verwalten         |
| Fewer Permission Prompts | `/fewer-permission-prompts` | Nach der Einrichtung: häufige Befehle whitelisten                         |

### 15.4 Projektspezifische Custom Skills (anlegen mit `/skill-creator`)

Diese Skills gibt es noch nicht, sollten aber für dieses Projekt erstellt werden:

| Skill (Vorschlag) | Zweck                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `pb-migration`    | Neue Pocketbase-Migration anlegen mit korrektem Namensschema und Modul-Check |
| `module-scaffold` | Neues Modul gerüsten: Route, Collection, Permission-Guard, Config-Eintrag    |
| `instance-deploy` | Instanz bauen und zu ANPA deployen (`INSTANCE=x pnpm build` + rsync)         |
| `anpa-check`      | Pocketbase + Directus auf ANPA prüfen (Prozesse laufen, Logs clean)          |

Custom Skills werden in `.claude/skills/` im Repo abgelegt und sind damit
für beide Entwickler sofort verfügbar.

---

## 16. Claude-Regeln für dieses Projekt

Diese Regeln gelten in jeder Session:

- **Keine Em-Dashes** in UI-Strings, Kommentaren oder Commit-Messages.
  Stattdessen: Punkte, Doppelpunkte, Kommas.
- **Echte Umlaute** (ü, ö, ä, ß) in allen deutschen UI-Texten.
  Ausnahme: technische Bezeichner und Migrations-Kommentare.
- **Crew-Bereich**: Ausschließlich Deutsch, keine i18n-Integration.
  Alle Strings hardcoded.
- **Pocketbase statt SQL**: Kein roher SQL-Code in der App.
  Alle Datenbankoperationen via PB-SDK oder REST-API.
- **SvelteKit env**: Immer `$env/static/public` für Build-Zeit-Werte.
  Nie `import.meta.env.*`.
- **Rechte-System**: Crew ohne explizite Permission sieht nur Dashboard
  mit Hinweis. Admin hat immer alles.
- **Additive Deploys**: rsync ohne `--delete`.
- **Keine amerikanischen Services** ohne explizite Zustimmung.

---

## 17. Nicht-Ziele (bewusst ausgelassen)

- Kein Server-Side-Rendering (adapter-static, SPA-Routing via Caddy)
- Kein eigener Mail-Server (Brevo SMTP reicht)
- Kein Kubernetes, kein Terraform
- Kein GraphQL (REST-API von PB und Directus reicht)
- Kein Edge-Runtime (Cloudflare Workers etc.)
- Keine eigene Bezahlung (Tickee bleibt externer Anbieter)

---

## 18. Phasen-Plan

| Phase | Inhalt                                                                     | Abhängigkeiten |
| ----- | -------------------------------------------------------------------------- | -------------- |
| 1     | Monorepo-Setup, Design-Tokens, UI-Komponenten, Hetzner-VPS, Coolify, Caddy | —              |
| 2     | Pocketbase-Setup, Collections, Auth (Magic Link), Grundlegendes Routing    | Phase 1        |
| 3     | Öffentliche Website (Home, Lineup, FAQ, Anfahrt) + Directus-Integration    | Phase 2        |
| 4     | User-Accounts, Profil, Support-Tickets                                     | Phase 2        |
| 5     | Crew-Bereich (Kalender, Briefings, Meilensteine, Permissions)              | Phase 4        |
| 6     | Admin-Bereich (User-Mgmt, Moderation, View-As)                             | Phase 5        |
| 7     | Community (Foto-Wall, Freundschaften, Karte)                               | Phase 4        |
| 8     | Capacitor iOS + Android (Build-Konfiguration, App-Store-Vorbereitung)      | Phase 3        |
| 9     | Cashless-Anbindung, Push-Notifications, Set-Reminder                       | Phase 7        |
| 10    | Performance-Audit, Store-Submission, Launch                                | Phase 9        |

---

## 19. Offene Entscheidungen (im Plan-Modus klären)

1. **Pocketbase vs. PostgreSQL + Hono-API**: Reicht SQLite für Festival-Last
   (Schätzung: 2.000 concurrent Users am Festival-Tag)?
   Falls nein: PostgreSQL + externe API-Schicht.

2. **Directus vs. Payload CMS**: Directus hat besseres Redakteurs-UI,
   Payload ist TypeScript-nativer. Wer pflegt Content (Entwickler oder
   Nicht-Entwickler)?

3. **ANPA Gitea**: URL und Zugangsdaten aus Bitwarden holen.
   Alle ANPA-Dienste sind grundsätzlich bestätigt.

4. **Foto-Upload-Limit**: Pocketbase Storage lokal auf ANPA (einfacher)
   oder separater S3-kompatibler Speicher für Community-Wall-Fotos?
   Abhängig vom verfügbaren Speicherplatz auf dem ANPA-Account.

---

_Erstellt: 2026-07-09 — für Übergabe an neuen Entwicklungspartner und Claude Code Plan-Modus_
