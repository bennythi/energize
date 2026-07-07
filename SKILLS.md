# Installierte Claude-Skills

Stand: 2026-06-19

## Repo-lokal (in `.claude/skills/`)

Diese sind Teil dieses Repos und werden mit dem Zip automatisch mitgenommen:

| Skill             | Zweck                                                             |
| ----------------- | ----------------------------------------------------------------- |
| `emil-design-eng` | UI-Polish, Component-Design, Animations-Regeln nach Emil Kowalski |
| `frontend-design` | Frontend-Design-Guidelines                                        |
| `senior-frontend` | Senior-Level Frontend-Patterns                                    |

`skills-lock.json` im Repo-Root sperrt die Version von `emil-design-eng`
auf einen konkreten GitHub-Commit-Hash (Reproduzierbarkeit).

## Global installiert (User-Level `~/.claude/skills/`)

Diese sind an den Claude-User gebunden, nicht ans Repo:

| Skill             | Zweck                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `emil-design-eng` | (dieselbe wie repo-lokal)                                          |
| `find-skills`     | Skills entdecken und installieren, wenn User nach Funktionen fragt |

## Weitere Skills die in Sessions verfuegbar waren

Aus vergangenen Sessions bekannt, wahrscheinlich via VS-Code-Extension:

- `deep-research` — Multi-Source Recherche mit adversariellem Fact-Check
- `code-review` — Diff-Review mit Bug-Finding
- `simplify` — Cleanup und Refactoring
- `security-review` — Security-Audit des Diffs
- `verify` — Feature-Verifikation durch echtes App-Starten
- `run` — App starten und Screenshot machen
- `review` — PR-Review
- `init` — CLAUDE.md initialisieren
- `loop` — Rekurrente Tasks laufen lassen
- `schedule` — Scheduled Cloud-Agents
- `keybindings-help` — Keyboard-Shortcuts anpassen
- `update-config` — settings.json bearbeiten
- `fewer-permission-prompts` — Bash/MCP-Whitelist erstellen
- `claude-api` — Anthropic-API-Referenz

Auf dem neuen Laptop tauchen die automatisch auf, sobald du die
Claude-Code-Extension installiert hast und die Session neu startest.

## Wie du auf dem neuen Laptop mit einem Skill arbeitest

- Slash-Command tippen: `/emil-design-eng` waehrend Claude aktiv ist
- Oder Claude fragen: "Kannst du das mit dem emil-design-eng Skill machen?"
- Wenn ein Skill nicht existiert: mit `/find-skills` einen suchen und
  installieren lassen

## Wenn ein Repo-Skill nach dem Auspacken nicht laedt

`skills-lock.json` erwartet den `computedHash`. Wenn Claude beim ersten
Start meckert dass der Hash nicht passt: einfach `pnpm claude reinstall`
oder die Session neu starten. Der Skill wird dann neu geholt.
