# SETUP-USER — Was DU machen musst

Diese Datei listet alle Aktionen, die ich (Claude) **nicht** allein erledigen kann.

## Status-Übersicht (Stand 2026-06-04)

| #   | Aktion                                              | Status                                    | Anleitung                                  |
| --- | --------------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| 1   | Sanity-Projekt anlegen + Project-ID einsetzen       | ✅ erledigt (`oxliq7rf`)                  | [sanity-setup.md](./sanity-setup.md)       |
| 2   | GitHub-Repo anlegen + Code pushen                   | ✅ erledigt (`bennythi/energize`, public) | [github-setup.md](./github-setup.md)       |
| 3   | Logo-SVGs vom Designer anfordern                    | ⏳ offen                                  | [brand-assets.md](./brand-assets.md)       |
| 4   | Apple Developer + Google Play Console (Brainchildz) | ⏳ offen                                  | [stores-setup.md](./stores-setup.md)       |
| 5   | ANPA: 2. ISPConfig-Site für Energize anlegen lassen | ⏳ wartet auf Mitarbeiter                 | [anpa-deploy.md](./anpa-deploy.md)         |
| 6   | Sanity-Seed importieren                             | ⏳ offen (NDJSON liegt bereit)            | `apps/studio/seed/README.md`               |
| 7   | siteSettings im Studio mit Datetime-Werten füllen   | ⏳ nach Seed-Import                       | `apps/studio/seed/README.md`               |
| 8   | Portainer-Passwort rotieren + 2FA aktivieren        | ✅ Passwort rotiert (2FA optional)        | (nur du im Portainer-UI)                   |
| 9   | Branch Protection für `main` aktivieren             | ⏳ wartet auf dein OK                     | `.github/README.md`                        |
| 10  | GitHub Secrets für Deploy-Workflow setzen           | ⏳ wartet auf 2. ANPA-Site                | [deploy-workflow.md](./deploy-workflow.md) |

## Aktuell wichtigste offene Punkte

- **5 + 8 + 9** sind die unmittelbaren Sachen, die nur du / dein Mitarbeiter erledigen können.

## Was läuft schon ohne deinen Input?

- **Phase-1-Foundation** komplett im Repo.
- **Style-Guide v0.9** als Tokens (Energize Yellow + Black + Plakat-Utility).
- **Sanity-Schemas** für 8 Document-Types (Phase 2 vorgezogen).
- **16 FAQ-Einträge** als Seed-Daten bereit zum Import.
- **`apps/web`** auf `adapter-static` umgestellt (passt zu ANPA-Apache).
- **CI** grün auf Node 20.
- **GitHub Repo public**, Branch-Protection-Konfig liegt commit-bereit unter `.github/branch-protection-main.json`.

## Was ich nicht kann

- Konten bei externen Diensten anlegen (Sanity, GitHub, Apple, Google) — du hast erfolgreich Sanity + GitHub erledigt.
- DNS-Records ändern, Domain umziehen.
- Logo-SVGs designen.
- Mit dem Brainchildz-Mitarbeiter sprechen (für 2. ANPA-Site).
- Portainer-Passwort ändern (deine Aufgabe).
- Branch Protection ohne dein explizites OK aktivieren (Auto-Mode-Sicherheitsregel).
