# SETUP-USER — Was DU machen musst

Diese Datei listet alle Aktionen, die ich (Claude) **nicht** allein erledigen kann. Reihenfolge ist priorisiert nach „kritisch zuerst" — du kannst sie aber auch parallel angehen.

## Status-Übersicht

| #   | Aktion                                         | Dauer                       | Blockiert                       | Anleitung                                |
| --- | ---------------------------------------------- | --------------------------- | ------------------------------- | ---------------------------------------- |
| 1   | Sanity-Projekt anlegen + Project-ID einsetzen  | 15 min                      | `apps/studio` lauffähig         | [sanity-setup.md](./sanity-setup.md)     |
| 2   | GitHub-Repo anlegen + Code pushen              | 10 min                      | Backups, CI, Kollaboration      | [github-setup.md](./github-setup.md)     |
| 3   | Logo-SVGs vom Designer anfordern               | 1× anstoßen, dann warten    | Hero / App-Icon / Splash-Screen | [brand-assets.md](./brand-assets.md)     |
| 4   | Apple Developer Program + Google Play Console  | 1–2 Tage Apple-Verifikation | Phase 4 + 10 (App-Submission)   | [stores-setup.md](./stores-setup.md)     |
| 5   | Hetzner VPS provisionieren + Caddy + Plausible | 2–4 h                       | Phase 3 (Web-Deploy)            | [hetzner-server.md](./hetzner-server.md) |

## Empfohlene Reihenfolge

**Tag 1 (entspannt):**

- Sanity-Projekt anlegen (15 min) — danach läuft `pnpm --filter @energize/studio dev` lokal.
- GitHub-Repo anlegen + erstes Push (10 min) — Code ist gesichert, CI läuft.
- Logo-SVG-Anforderung an Designer schicken (siehe [brand-assets.md](./brand-assets.md)).

**Tag 2 (1–2 h Zeit nötig):**

- Apple/Google Konten beantragen (Klick-Aufwand 30 min, Wartezeit 1–2 Tage).

**Diese Woche (parallel zur Phase-2-Arbeit):**

- Hetzner-Server hochziehen (2–4 h) — relevant ab Phase 3.

## Was läuft schon ohne deinen Input?

- **Phase-1-Code** (Foundation) ist komplett angelegt — wartet nur auf `pnpm install`.
- **Brand-Tokens sind echt** — aus Style-Guide v0.9 (Energize Yellow `#FFEC00`, Energize Black `#0A0A0A`, Surface Dark `#1F1F1F` etc.). Siehe [styleguide-reference.md](./styleguide-reference.md).
- **Hello-World Web** funktioniert nach `pnpm install` + `pnpm --filter @energize/web dev`.
- **Hello-World App-im-Browser** funktioniert ebenfalls (`pnpm --filter @energize/app dev`).
- **Capacitor-Native-Projekte** (`apps/app/ios`, `apps/app/android`) werden in Phase 4 erzeugt.

## Was ich nicht kann

- Konten bei externen Diensten (Sanity, GitHub, Apple, Google, Hetzner, Brainchildz-DUNS) anlegen.
- DNS-Records ändern.
- Domain umziehen.
- Logo-SVGs designen — wir brauchen die offiziellen Brand-Assets vom Designer.
- iOS-Build auf realem Gerät (Apple-Verifikation + Provisioning-Profile erforderlich).
