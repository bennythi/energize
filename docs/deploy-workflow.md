# GitHub-Actions-Deploy-Workflow

**Datei:** `.github/workflows/deploy.yml`

Trigger: jeder Push auf `main` (nachdem CI grün ist) plus manueller `workflow_dispatch`.

## Voraussetzung: GitHub-Secrets anlegen

Im GitHub-UI unter `https://github.com/bennythi/energize/settings/secrets/actions`:

| Secret-Name        | Inhalt                                                                          | Wie kommt der Wert zustande                 |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------- |
| `ANPA_SSH_KEY`     | Private-Key des CI-Deploy-Keys (PEM, mit `-----BEGIN OPENSSH PRIVATE KEY-----`) | Lokal generieren — siehe unten              |
| `ANPA_KNOWN_HOSTS` | Inhalt von `~/.ssh/known_hosts` (nur die ANPA-Zeile)                            | `ssh-keyscan -p 64022 web.anpa-networks.de` |
| `ANPA_HOST`        | `web.anpa-networks.de`                                                          | Server-Hostname                             |
| `ANPA_PORT`        | `64022`                                                                         | SSH-Port                                    |
| `ANPA_USER`        | z. B. `benjamin_thielupload` oder neuer User der 2. Site                        | sobald 2. Site steht                        |
| `ANPA_TARGET`      | z. B. `~/web/` oder `/var/www/clients/clientX/webYYY/web/`                      | sobald 2. Site steht                        |

## CI-Deploy-Key generieren

**Nicht** den persönlichen `id_ed25519` nutzen — separater Key für die Maschine.

```powershell
# Im Repo-Root:
ssh-keygen -t ed25519 -f .github/anpa_deploy_key -C "github-actions@energize" -N '""'
```

Das schreibt zwei Dateien:

- `.github/anpa_deploy_key` (private — **NICHT** committen, in `.gitignore` aufnehmen!)
- `.github/anpa_deploy_key.pub` (public — Inhalt zum Server)

### Public-Key auf den Server schieben

```powershell
Get-Content ".github/anpa_deploy_key.pub" | ssh anpa "cat >> ~/.ssh/authorized_keys && echo OK"
```

(Mit dem neuen Site-User wenn ANPA_USER ≠ `benjamin_thielupload`.)

### Private-Key in GitHub Secret kopieren

```powershell
Get-Content ".github/anpa_deploy_key" | Set-Clipboard
```

→ in GitHub → Settings → Secrets → New → `ANPA_SSH_KEY` → einfügen.

### Lokalen Private-Key löschen (Key liegt jetzt in GitHub)

```powershell
Remove-Item .github/anpa_deploy_key
```

## known_hosts-Snippet generieren

```powershell
& "C:\Program Files\Git\usr\bin\ssh-keyscan.exe" -p 64022 -t ed25519 web.anpa-networks.de | Set-Clipboard
```

→ `ANPA_KNOWN_HOSTS` Secret befüllen.

## Workflow-Test (sobald 2. Site steht)

1. Push auf `main` → schau Actions an.
2. „Deploy" sollte automatisch nach CI laufen.
3. Auf der Test-Subdomain Hero-Hello-World sichtbar.

## Manueller Trigger

GitHub → Actions → „Deploy to ANPA" → „Run workflow" → main → start.

Nützlich für: Initial-Deploy, Re-Deploy nach Sanity-Content-Webhook, Rollback (push einen alten Commit).

## Rollback

```powershell
git revert <commit-sha>
git push origin main
```

Triggert neuen Build + Deploy. Echter „Rollback" zu altem Zustand. Workflow überschreibt mit `--delete`, also alle Dateien werden konsistent zurückgesetzt.
