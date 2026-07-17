# ANPA-Deploy — Server-Setup und Workflow

**Ziel:** SvelteKit-Build aus dem Repo automatisch per GitHub Actions auf den ANPA-Webspace deployen.

**Status:** Wartet auf die zweite ISPConfig-Site (siehe unten). Stand 2026-06-04 läuft `~/web` auf der Login `benjamin_thielupload` noch unter blackout42.de — wir dürfen das nicht überschreiben.

## Server-Übersicht

| Schicht               | Wert                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| Host                  | `web.anpa-networks.de`, SSH-Port **`64022`**                         |
| Login-User            | `benjamin_thielupload` (mapped auf System-User `web102`)             |
| Home                  | `/var/www/clients/client7/web102/home/benjamin_thielupload`          |
| DocumentRoot (Apache) | `~/web` → `/var/www/clients/client7/web102/web`                      |
| Node                  | 20.20.2                                                              |
| rsync                 | 3.2.7                                                                |
| git                   | 2.39.5                                                               |
| OS                    | Debian 12                                                            |
| Docker-Server         | separat: `portainer.anpa-networks.de` (für Phase 7+, Plausible etc.) |

SSH-Alias `anpa` ist lokal in `~/.ssh/config` eingetragen → `ssh anpa` reicht.

## Was vom Mitarbeiter noch nötig ist

> **Zweite ISPConfig-Site für Energize anlegen** — separates Web-Verzeichnis (oder zusätzliche Domain auf derselben Site, je nach Setup), Public-Key wieder in `authorized_keys` des dazugehörigen SSH-Users. Erstmal Test-Subdomain (z. B. `staging.brainchildz.de` oder `energize.anpa-networks.de`), `energize-festival.de`-DNS-Cutover kommt erst kurz vor Festival.

Sobald die zweite Site steht, brauchen wir vom Mitarbeiter:

- Hostname/Login-Alias der neuen Site (oder Bestätigung, dass `benjamin_thielupload` auch dort hin schreiben darf).
- Pfad des neuen DocumentRoot (z. B. `/var/www/clients/clientX/webYYY/web`).
- URL der Test-Subdomain, unter der wir den Build sehen können.

## SSH-Key-Lage (vorhanden)

- Persönlicher Key: `~/.ssh/id_ed25519` (auch für GitHub im Einsatz). Public-Teil liegt bereits in `authorized_keys` auf ANPA.
- **CI-Deploy-Key:** noch zu generieren (siehe `deploy-workflow.md`).

## Deploy-Pfad (Plan)

1. Push auf `main` → GitHub Actions `ci.yml` (Lint, Typecheck, Build) → grün.
2. Bei grünem CI auf `main` → GitHub Actions `deploy.yml` triggert.
3. Workflow läuft `pnpm install` + `pnpm --filter @energize/web build`.
4. `rsync -avz --delete apps/web/build/ web102@anpa:~/web/` (oder anderer Pfad je nach Zielsite).

Konfiguriert über GitHub Secrets — siehe `deploy-workflow.md`.
