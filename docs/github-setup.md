# GitHub-Setup

**Ziel:** Privates Repo `energize` anlegen, lokalen Code pushen, CI aktivieren.

**Dauer:** ~10 Minuten.

## 1. GitHub-Account & Organization

Wenn du noch keine Brainchildz-Organization hast: erstmal das Repo auf deinem persönlichen Account anlegen. Wir können es später in eine Org transferieren ohne URL-Bruch (GitHub leitet automatisch um).

Falls Brainchildz schon eine Org hat: direkt dort anlegen.

## 2. Privates Repo erstellen

1. **https://github.com/new** öffnen.
2. Repository name: **`energize`**
3. Description: `ENERGIZE Festival 2027 — Web + iOS/Android monorepo`
4. **Private** auswählen.
5. **„Initialize this repository with"** alles abwählen (kein README, kein .gitignore, keine License) — der lokale Code bringt das alles schon mit.
6. **Create repository** klicken.

GitHub zeigt jetzt einen Quick-Setup-Bildschirm mit der Repo-URL, z. B.:

```
https://github.com/<dein-username>/energize.git
git@github.com:<dein-username>/energize.git
```

## 3. SSH-Key (empfohlen) oder HTTPS

### Variante A: SSH (empfohlen, einmaliger Aufwand)

```powershell
# SSH-Key prüfen ob vorhanden
Test-Path "$HOME\.ssh\id_ed25519.pub"
```

Falls `False`:

```powershell
ssh-keygen -t ed25519 -C "deine.email@brainchildz.de" -f "$HOME\.ssh\id_ed25519"
# Bei Passphrase Enter drücken für leer (oder Passphrase setzen)
```

Public Key kopieren:

```powershell
Get-Content "$HOME\.ssh\id_ed25519.pub" | Set-Clipboard
```

Auf **https://github.com/settings/keys** → **„New SSH key"** → Titel: `Energize Dev Win`, Key-Feld: einfügen, speichern.

### Variante B: HTTPS mit Personal Access Token

Wenn du SSH nicht magst: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (scope: `repo`). Token bei `git push` als Passwort eingeben (Git Credential Manager merkt sich's).

## 4. Lokales Repo verknüpfen + pushen

```powershell
# In das Projekt wechseln
Set-Location C:\Users\benja\projects\energize

# Status checken — sollten viele neue Files sein
git status

# Remote setzen (SSH-Variante)
git remote add origin git@github.com:<dein-username>/energize.git
# oder HTTPS:
# git remote add origin https://github.com/<dein-username>/energize.git

# Alles committen (falls noch nicht gemacht)
git add -A
git commit -m "feat: phase 1 monorepo foundation"

# Push
git push -u origin main
```

## 5. Repo-Settings (im Browser)

Nach dem Push auf **https://github.com/<dein-username>/energize/settings**:

1. **General → Default branch**: `main` (sollte schon stimmen).
2. **Branches → Branch protection rules → Add rule**:
   - Branch name pattern: `main`
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging → wähle `CI` (sobald die erste CI gelaufen ist)
   - ✅ Do not allow bypassing the above settings
3. **Collaborators**: ggf. Brainchildz-Team-Member einladen.

## 6. CI-Check

Nach dem ersten Push sollte auf **Actions**-Tab der CI-Workflow „CI — Lint + Typecheck + Build" starten. Wenn er rot ist, schreib mir die Fehlermeldung — wir fixen das vor Phase 2.

## 7. Spätere Transfer in Brainchildz-Org

GitHub → Repo-Settings → **„Transfer ownership"** → Brainchildz-Org-Name eingeben. URLs aus Phase 1 leiten automatisch um.
