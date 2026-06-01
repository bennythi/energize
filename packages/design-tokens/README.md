# @energize/design-tokens

Brand-Tokens als Quelle der Wahrheit für Web und App.

## Status

⚠️ **Platzhalter-Werte** — monochrom Schwarz/Weiß, Barlow Condensed Display, Inter Body.
Bis die Wix-Inspect-Werte aus [docs/wix-inspect.md](../../docs/wix-inspect.md) vorliegen.

## Exports

| Pfad                                 | Verwendung                                                            |
| ------------------------------------ | --------------------------------------------------------------------- |
| `@energize/design-tokens`            | TS-Konstanten (`colors`, `typography`, `spacing`, `radii`, `shadows`) |
| `@energize/design-tokens/theme.css`  | Tailwind v4 `@theme`-Block (von Apps importiert)                      |
| `@energize/design-tokens/tokens.css` | Plain CSS-Variablen für Non-Tailwind-Konsumenten                      |

## Update-Workflow nach Wix-Inspect

1. Werte in `src/colors.ts`, `src/typography.ts`, etc. ersetzen.
2. Gleichzeitig `src/theme.css` und `src/tokens.css` updaten (gleiche Werte!).
3. `pnpm --filter web dev` — Hero-Hello-World validiert visuell.
