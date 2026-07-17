# ENERGIZE Festival 2027 — Web + iOS/Android

Monorepo für die offizielle Website und die nativen Apps (iOS + Android) des ENERGIZE Festivals 2027 (29.05.2027, Stockelsdorf bei Lübeck). Veranstalter: **Brainchildz Event Agentur**.

## Stack

- **SvelteKit 2** + **Tailwind v4** für Web und App
- **Capacitor 6** für native iOS/Android-Container (eine SvelteKit-Codebase, ~90 % Sharing)
- **Sanity** Headless CMS (Inhalte: Lineup, FAQ, POIs, Sponsoren)
- **Supabase** für Auth, DB, Storage, Realtime (EU-Region Frankfurt)
- **Paraglide-JS** für DE + EN i18n
- **pnpm 9** + **Turborepo 2** Monorepo
- **TypeScript strict** überall
- **ESLint Flat Config** + **Prettier** + **Husky** + **lint-staged**
- **GitHub Actions** CI (lint + typecheck + build)

## Schnellstart

> Voraussetzung: **Node 22 LTS**. pnpm 9 wird automatisch über Corepack aktiviert.

```powershell
# einmalig
corepack enable
corepack prepare pnpm@9.15.0 --activate

# Dependencies installieren (führt auch paraglide compile aus)
pnpm install

# Web im Browser
pnpm --filter @energize/web dev      # http://localhost:5173

# App im Browser-Vorschau-Modus
pnpm --filter @energize/app dev      # http://localhost:5174

# Sanity Studio (Project-ID muss vorher in apps/studio/sanity.config.ts gesetzt sein)
pnpm --filter @energize/studio dev   # http://localhost:3333
```

## Monorepo-Layout

```
apps/
  web/        — SvelteKit Marketing-Site (adapter-node)
  app/        — SvelteKit + Capacitor (adapter-static)
  studio/     — Sanity Studio
packages/
  design-tokens/  — Brand-Tokens (Farben, Typo, Spacing) → Tailwind theme + CSS Vars
  ui/             — Geteilte Svelte-5-Komponenten (Container, Heading, Button, Hero, Footer)
  i18n/           — Paraglide-Setup (DE + EN)
  tsconfig/       — Geteilte tsconfigs (base, svelte, node)
docs/
  SETUP-USER.md            — Was DU machen musst (Übersicht)
  wix-inspect.md           — Wix-DevTools-Inspect (für echte Brand-Tokens)
  sanity-setup.md          — Sanity-Account + Projekt anlegen
  github-setup.md          — GitHub-Repo + SSH + Push
  stores-setup.md          — Apple Developer + Google Play Console
  hetzner-server.md        — VPS provisionieren + Caddy + Plausible
```

## Phasen-Plan

Detaillierter Roadmap-Plan: `C:\Users\benja\.claude\plans\du-bist-im-plan-mode-piped-bentley.md` (außerhalb des Repos, im Claude-Workspace).

- **Phase 1 (jetzt):** Foundation — Monorepo, Tokens, UI, i18n, Hello-World Web + App, Studio-Skelett
- **Phase 2:** Sanity-Schemas + Supabase verdrahten + Auth-Skeleton
- **Phase 3:** Public Website ausbauen (Home, Lineup, FAQ, Anfahrt, Background, Media, …)
- **Phase 4:** App-Public-Tab + Capacitor iOS/Android-Build auf realen Geräten
- **Phase 5:** Login + persönlicher Bereich
- **Phase 6:** Karte (SVG mit POIs, offline-fähig)
- **Phase 7:** Push-Notifications + Set-Reminder
- **Phase 8:** Foto-Wall + Mod-Tool
- **Phase 9:** Cashless-Anbindung
- **Phase 10:** Store-Submission + Launch

## Verifikation Phase 1

```powershell
pnpm install
pnpm turbo lint typecheck build
pnpm --filter @energize/web dev
# → Browser zeigt Hero "ENERGIZE" mit Sprach-Toggle DE↔EN
```

## Nächste Aktionen für dich

Siehe [docs/SETUP-USER.md](./docs/SETUP-USER.md) für die vollständige Checkliste.
