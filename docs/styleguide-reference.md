# Style-Guide-Referenz

Brand-Tokens stammen aus dem offiziellen **Energize Style-Guide v0.9** (Stand 26.04.2026, erstellt von Benjamin Thiel).

Bitte das PDF im Repo unter `docs/brand/Style-Guide-v0.9.pdf` ablegen, sobald du dazu kommst — dann ist es versioniert greifbar.

## Farbpalette (1:1 übernommen)

| Style-Guide-Name | Hex       | RGB             | Einsatz                                         | Token in Code              |
| ---------------- | --------- | --------------- | ----------------------------------------------- | -------------------------- |
| Energize Yellow  | `#FFEC00` | 255 / 236 / 0   | Hauptakzent, Highlight-Banner, Marken-Identität | `accent`                   |
| Pure Yellow      | `#FFFF00` | 255 / 255 / 0   | Plakat-Flächen, Logo-Hintergrund                | `accentPure`               |
| Energize Black   | `#0A0A0A` | 10 / 10 / 10    | Logo, Haupttext, Tabellen-Header                | `bg`, `fgInverse`          |
| Surface Dark     | `#1F1F1F` | 31 / 31 / 31    | Dunkle Container, Akzentflächen                 | `surface`                  |
| Surface Light    | `#F5F5F2` | 245 / 245 / 242 | Helle Hintergründe, Body                        | `bgLight`, `fg` (auf Dark) |
| Border Gray      | `#DDDDDD` | 221 / 221 / 221 | Trennlinien, Tabellen-Gitter                    | `borderLight`              |
| Text Muted       | `#666666` | 102 / 102 / 102 | Sekundärtext, Beschriftungen                    | `fgMuted`                  |
| Success Green    | `#22C77B` | 34 / 199 / 123  | OK-Status, positive Werte                       | `success`                  |
| Alert Red        | `#E24B4A` | 226 / 75 / 74   | Warnungen, Schließungen                         | `danger`                   |

Quelle der Wahrheit in Code: [`packages/design-tokens/src/colors.ts`](../packages/design-tokens/src/colors.ts).

## Anwendungsregeln

| Regel              | Beschreibung                                                                           |
| ------------------ | -------------------------------------------------------------------------------------- |
| Gelb auf Schwarz   | Höchster Kontrast — für Logos, Plakate, Highlight-Banner. **Energize-typisch.**        |
| Schwarz auf Gelb   | Wie auf den Plakaten — für „NO MAINSTREAM SHIT"-Style-Hervorhebungen, ACHTUNG-Boxen.   |
| Gelb auf Weiß      | **Vermeiden** — schlecht lesbar. Nur als Akzent-Streifen oder Border (≥ 2 pt).         |
| Schwarz auf Weiß   | Standard-Lesetext und Tabelleninhalte.                                                 |
| Hot Magenta / Cyan | **Nicht im Energize-Schema** — nur Schwarz, Gelb, neutrale Töne.                       |
| Logo-Schutzraum    | Mindestabstand um Logo = ½ Höhe des Signets. Nie auf Gelb mit Schwarz-Logo überlagern. |

## Was im Code daraus folgt

- **Dark-Mode-Default:** `bg = #0A0A0A`, `fg = #F5F5F2` — Schwarz-Hintergrund mit hellem Text.
- **CTAs:** `<Button variant="yellow">` (Gelb auf Schwarz) ist der Default. `inverse` (Schwarz auf Gelb) für Plakat-Stil. `ghost` für sekundäre Aktionen.
- **Plakat-Style:** Utility-Klasse `.plakat` (in `app.css`) erzeugt Gelb-Hintergrund + schwarzer Display-Text — für „NO_MAINSTREAM_SHIT"-Boxen.
- **Glow:** Box/Text-Shadows nutzen `rgba(255, 236, 0, 0.25)` — passend zur Marke statt generisches Weiß.

## Was im Style-Guide NICHT spezifiziert ist

- **Schrift-Lizenz** — die Wortmarke „ENERGIZE" nutzt eine geometrisch-eckige Display-Schrift, die im Guide nicht benannt ist. Bis Klärung verwenden wir Barlow Condensed Black als nächste Open-Source-Annäherung. Das echte Logo wird als SVG eingebunden (siehe [`brand-assets.md`](./brand-assets.md)).
- **Spacing/Radii/Shadows** — sind nicht im Guide; wir nutzen unsere eigenen Defaults im Token-Paket.
- **2027er Saison-Motto** — 2026 war „The Ultimate Reality"; für 2027 ist das Motto noch offen.
