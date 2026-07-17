# Brand-Assets

Alle Files in diesem Ordner sind unter `https://energize.blackout42.de/brand/<dateiname>` direkt erreichbar — landen also live im Bundle und können ohne Bauarbeit eingebunden werden.

## Empfohlene Datei-Konventionen

| Datei                  | Format                                 | Notiz                                                                              |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `wordmark.svg`         | SVG, schwarz `#0a0a0a` auf transparent | Großer Schriftzug "ENERGIZE", monochrom — colorbar via `currentColor` wenn möglich |
| `wordmark-yellow.svg`  | SVG, gelb `#FFEC00` auf transparent    | Hero-Variante für dunkle Hintergründe                                              |
| `signet.svg`           | SVG, quadratisch                       | Bildmarke ohne Text — für Avatars, kleine Buttons                                  |
| `motto-2027.svg`       | SVG                                    | Saison-Motto (analog "The Ultimate Reality" 2026)                                  |
| `og-image.png`         | PNG 1200×630                           | Social-Sharing-Card                                                                |
| `apple-touch-icon.png` | PNG 180×180                            | iOS Home-Screen                                                                    |
| `favicon.svg`          | SVG (klein)                            | Tab-Icon — liegt schon in `apps/web/static/favicon.svg`                            |

## SVG-Tipps

- **`viewBox` setzen**, **keine fixe `width`/`height`** — dann skaliert es responsive
- **Schwarze Variante** mit `fill="currentColor"` machen → wir können sie mit `text-fg`/`text-accent`/`text-fg-inverse` einfärben
- Whitespace im SVG-Code raus → kleinere Bundle-Size (z.B. via [svgomg.app](https://jakearchibald.github.io/svgomg/))

## Direkt einbinden

```html
<!-- Als img-Tag (statisch, kein color-control) -->
<img src="/brand/wordmark.svg" alt="ENERGIZE" />

<!-- Als inline-SVG kopiert (color-control via Tailwind) -->
<svg class="text-accent" ...>...</svg>
```

Wenn du Files hier ablegst, sag Bescheid welche — ich bind sie dann an den passenden Stellen ein (Header, Footer, Hero, Social-Cards).
