# Brand-Assets — Logos & Schriften

Der Style-Guide v0.9 beschreibt drei Logo-Varianten — aktuell liegen sie nur **gerastert** im PDF vor. Für Web + App brauchen wir die **SVG-Originale** (oder hochauflösendes PNG mit transparentem Hintergrund).

## Bitte vom Designer / Marketing anfordern

| Asset                              | Format           | Ablegen unter                          | Genutzt von                               |
| ---------------------------------- | ---------------- | -------------------------------------- | ----------------------------------------- |
| Energize Signet (Bildmarke / Icon) | SVG, transparent | `apps/web/static/brand/signet.svg`     | Header-Logo, App-Icon, Favicon, Social-OG |
| Energize Schriftzug (Wortmarke)    | SVG, transparent | `apps/web/static/brand/wordmark.svg`   | Hero, Footer-Branding                     |
| Saison-Motto 2027                  | SVG, transparent | `apps/web/static/brand/motto-2027.svg` | Hero-Secondary, Merch-Bereich             |
| Style-Guide v0.9                   | PDF              | `docs/brand/Style-Guide-v0.9.pdf`      | Referenz im Repo                          |

Beim Übergeben bitte:

- **Schwarze Variante** (Default auf hellen Backgrounds)
- **Gelbe Variante** (Default auf schwarzem Background, Energize-typisch)
- **Weiße Variante** (Fallback wenn weder Gelb noch Schwarz funktionieren)
- **Schutzraum** als unsichtbare Padding-Box im SVG (½ Höhe des Signets, laut Style-Guide).

## Saison-Motto 2027

2026 war **„The Ultimate Reality"**. Für 2027 ist das Motto noch offen — sobald es feststeht, fließt es als Sanity-CMS-Feld in `siteSettings.seasonMotto` ein und der Saison-Motto-SVG kommt nach `apps/web/static/brand/motto-2027.svg`.

## Schrift

Der „ENERGIZE"-Wortmark nutzt eine geometrisch-eckige Display-Schrift, die im Style-Guide nicht benannt ist. Optionen:

1. **Logo ausschließlich als SVG** verwenden — Wortmarke wird nie als Live-Text gerendert (sicherste Option, kein Lizenz-Aufwand).
2. **Schrift identifizieren** (z. B. mit WhatTheFont): falls Open-Source → einbinden; falls kommerziell → Brainchildz lizenziert.
3. **Barlow Condensed Black** (Open-Source, kostenlos) als Live-Text-Fallback für H1/Hero — schon eingebunden via Google Fonts.

Aktuell laufen wir mit Variante 1 + 3 parallel: Wortmark = SVG (sobald da), Hero-Live-Text = Barlow Condensed Black.

## App-Icons (Phase 4)

Für iOS + Android brauchen wir später auch:

- **App-Icon**: 1024 × 1024 PNG, **kein** Alpha-Kanal, **kein** Rand — Apple und Google runden automatisch.
- **Splash-Screen**: 2732 × 2732 PNG, Logo zentriert, Energize-Schwarz-Hintergrund (`#0A0A0A`).
- **Notification-Icon (Android)**: monochrom-weißes PNG, 96 × 96, transparent.

Capacitor erwartet diese unter `apps/app/resources/` — kommt in Phase 4 dran.
