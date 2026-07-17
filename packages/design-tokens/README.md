# @energize/design-tokens

Brand-Tokens aus dem offiziellen **Energize Style-Guide v0.9** (26.04.2026, erstellt von Benjamin Thiel).

## Farbpalette

| Token         | Hex       | Style-Guide-Name | Einsatz                                   |
| ------------- | --------- | ---------------- | ----------------------------------------- |
| `bg`          | `#0A0A0A` | Energize Black   | Haupt-Hintergrund (Dark), Logo, Haupttext |
| `surface`     | `#1F1F1F` | Surface Dark     | Container, Akzentflächen                  |
| `bgLight`     | `#F5F5F2` | Surface Light    | Helle Hintergründe, Body                  |
| `border`      | `#1F1F1F` | —                | Border im Dark-Mode                       |
| `borderLight` | `#DDDDDD` | Border Gray      | Trennlinien, Tabellen-Gitter              |
| `fg`          | `#F5F5F2` | Surface Light    | Text auf Dark                             |
| `fgInverse`   | `#0A0A0A` | Energize Black   | Text auf Gelb / Weiß                      |
| `fgMuted`     | `#666666` | Text Muted       | Sekundärtext, Beschriftungen              |
| `accent`      | `#FFEC00` | Energize Yellow  | Hauptakzent, CTAs, Highlight-Banner       |
| `accentPure`  | `#FFFF00` | Pure Yellow      | Plakat-Flächen, Logo-Hintergrund          |
| `success`     | `#22C77B` | Success Green    | OK-Status, positive Werte                 |
| `danger`      | `#E24B4A` | Alert Red        | Warnungen, Schließungen                   |

## Brand-Regeln

- **Gelb auf Schwarz** → höchster Kontrast, Hero-Look (Energize-typisch).
- **Schwarz auf Gelb** → „NO_MAINSTREAM_SHIT"-Plakat-Style, ACHTUNG-Boxen.
- **Gelb auf Weiß** → VERMEIDEN (schlecht lesbar). Nur als Akzent-Streifen oder Border (≥2 pt).
- **Schwarz auf Weiß** → Standard-Lesetext und Tabelleninhalte.
- **Hot Magenta / Cyan** → NICHT im Energize-Schema.
- **Logo-Schutzraum** → Mindestabstand um Logo = ½ Höhe des Signets. Nie auf Gelb mit Schwarz-Logo überlagern.

## Exports

| Pfad                                 | Verwendung                                                            |
| ------------------------------------ | --------------------------------------------------------------------- |
| `@energize/design-tokens`            | TS-Konstanten (`colors`, `typography`, `spacing`, `radii`, `shadows`) |
| `@energize/design-tokens/theme.css`  | Tailwind v4 `@theme`-Block                                            |
| `@energize/design-tokens/tokens.css` | Plain CSS-Vars (Style-Guide-Originalnamen plus App-Aliasse)           |

## Logo-Assets

Drei Markenzeichen laut Style-Guide:

1. **Energize Signet** — Bildmarke / Icon
2. **Energize Schriftzug** — Wortmarke
3. **Saison-Motto** — 2026 = „The Ultimate Reality"; 2027-Motto noch offen

⚠️ **SVG-Originale fehlen** — bitte vom Designer anfordern und unter `apps/web/static/brand/` ablegen (siehe [`docs/brand-assets.md`](../../docs/brand-assets.md)).
