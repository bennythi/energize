# @energize/app

SvelteKit (adapter-static) verpackt in Capacitor für iOS + Android.

## Lokal entwickeln (Browser-Vorschau)

```powershell
pnpm --filter @energize/app dev
```

## Native Projekte initialisieren (Phase 4 — noch nicht in Phase 1)

```powershell
pnpm --filter @energize/app build
pnpm --filter @energize/app exec cap add android   # plattformunabhängig
pnpm --filter @energize/app exec cap add ios       # nur macOS
pnpm --filter @energize/app cap:sync
pnpm --filter @energize/app cap:open:android
```

`capacitor.config.ts` ist schon vorhanden mit `appId: de.energize-festival.app`.
