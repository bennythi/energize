# Backend: Pocketbase

Self-hosted Backend der Plattform (Auth, DB, Storage, Realtime) auf Basis von
**Pocketbase** (ein Go-Binary, SQLite). Ersetzt Supabase.

## Lokales Setup (Windows)

Das Binary und die Datenbank (`pb_data/`) sind bewusst NICHT im Git (siehe
`.gitignore`), da plattform- bzw. instanzspezifisch.

1. Binary holen (einmalig): Pocketbase `v0.39.7` Windows-amd64 nach
   `backend/pocketbase/pocketbase.exe` entpacken.
   Download: https://github.com/pocketbase/pocketbase/releases
2. Superuser anlegen (einmalig):
   ```powershell
   backend/pocketbase/pocketbase.exe --dir backend/pocketbase/pb_data superuser upsert admin@local.test <passwort>
   ```
3. Starten (aus dem Repo-Root):
   ```powershell
   pnpm pb:serve
   ```
   API: http://127.0.0.1:8090/api/ , Admin-UI: http://127.0.0.1:8090/_/
   Migrationen aus `pb_migrations/` laufen beim Start automatisch.
4. TypeScript-Typen aus dem laufenden Schema generieren (nach Schema-Aenderungen):
   ```powershell
   pnpm pb:typegen
   ```
   Erzeugt `packages/pb-client/src/generated/pb-types.ts`.

## Struktur

- `pocketbase/pb_migrations/` — JS-Migrationen (versioniert, modul-getaggt),
  laufen automatisch beim Start. Core-Migrationen (`*_core_*`) legen users-OTP,
  `profiles`, `account_flags` und das Crew-Permission-Modell an.
- `pocketbase/pb_hooks/` — JS-Hooks + Custom-Routes:
  - `crew.pb.js` — `GET /api/crew/my-permissions` (hydratisiert den Auth-Store).
  - `admin.pb.js` — Admin-Routen (View-As, set-flags, role/user-permission).
  - `lib/permissions.js` — geteilte Berechtigungs-Logik (require-bar).
  - Hinweis: PB-JSVM-Route-Handler laufen isoliert. Geteilte Logik daher immer
    per `require(`${__hooks}/lib/...`)` INNERHALB des Handlers, nie ueber
    Top-Level-Funktionen der Datei.
- `directus/` — CMS-Konfiguration (Phase 4).

## Sicherheit (Kurzform)

- `account_flags` (Rolle/Crew) hat null-Regeln: nur Superuser/Hooks schreiben.
  Rechte-Eskalation ausgeschlossen, der Client schreibt hier nie.
- `profiles` ist selbst-editierbar, enthaelt aber keine privilegierten Felder.
- Effektive Rechte kommen ausschliesslich aus `/api/crew/my-permissions`.
