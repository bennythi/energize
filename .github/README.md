# GitHub-Konfiguration

## `workflows/ci.yml`

CI-Pipeline: Lint + Typecheck + Build auf jeden Push + Pull Request gegen `main`.

## `branch-protection-main.json`

⚠️ **Aktuell nicht aktiv.** GitHub Free unterstützt Branch Protection nur für **öffentliche** Repos. Diese Datei ist die fertige Konfiguration für den Moment, wenn eine der folgenden Optionen umgesetzt wird:

### Option A — Repo public machen (kostenlos)

```powershell
gh api -X PATCH repos/bennythi/energize -F private=false
gh api -X PUT repos/bennythi/energize/branches/main/protection --input .github/branch-protection-main.json
```

Risiken: Sanity-Project-ID, Capacitor-Bundle-ID etc. werden öffentlich. Real-Secrets (Sanity-API-Token, Supabase-Service-Key) gehören sowieso in `.env`/GitHub Secrets, nicht ins Repo — passt also.

### Option B — Transfer in Brainchildz-Organization mit GitHub Team-Plan (4 USD / User / Monat)

1. Brainchildz-Org auf GitHub anlegen + Team-Plan abonnieren.
2. Repo-Settings → „Transfer ownership" → in die Org.
3. Branch Protection-Befehl wie oben (Pfad-Owner ändert sich automatisch).

### Option C — GitHub Pro für persönlichen Account (4 USD / Monat)

Einfachste Variante, behält das Repo unter `bennythi`. Branch Protection direkt aktivierbar.

## Was die Branch-Protection-Regel macht (sobald aktiv)

- PR-Pflicht für `main` (kein Direct-Push, auch nicht für Admins).
- CI-Check `Lint + Typecheck + Build` muss grün sein.
- Branch muss up-to-date mit `main` sein vor Merge.
- Lineare History (kein Merge-Commit-Spam).
- Konversationen auf PRs müssen aufgelöst sein.
- Kein Force-Push, kein Delete von `main`.
- `enforce_admins=true` → auch du selbst musst die Regeln einhalten.
