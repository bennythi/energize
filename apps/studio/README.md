# @energize/studio

Sanity Studio für das ENERGIZE Festival CMS.

## Setup

1. Sanity-Projekt anlegen — siehe [docs/sanity-setup.md](../../docs/sanity-setup.md).
2. Project-ID und Dataset in **beiden** Dateien ersetzen:
   - `sanity.config.ts` → `projectId`
   - `sanity.cli.ts` → `api.projectId`
3. `pnpm --filter @energize/studio dev` startet das Studio lokal auf `http://localhost:3333`.

## Deploy auf Sanity Cloud (Phase 2)

```powershell
pnpm --filter @energize/studio deploy
```

Vergibt die URL `<projectname>.sanity.studio`.

## Schemas

Aktuell leer — Schema-Typen kommen in Phase 2.
