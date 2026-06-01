# Wix-Inspect — echte Brand-Tokens extrahieren

**Ziel:** Die echten CSS-Werte (Hex-Codes, Schriften, Spacing) aus der bestehenden Wix-Seite ziehen und ins Token-Paket übernehmen, damit der Brand-Look von Tag 1 stimmt.

**Dauer:** ~30 Minuten.

**Wann:** Sobald du Lust hast — die Phase-1-Foundation läuft schon mit Platzhalter-Werten (monochrom Schwarz/Weiß, Barlow Condensed, Inter). Sobald deine Werte kommen, tausche ich sie in einem Commit aus.

## Anleitung Schritt für Schritt

1. **Chrome öffnen** (Firefox geht auch, Anleitung ist für Chrome).
2. **`https://www.energize-festival.de/`** öffnen.
3. **DevTools** mit `F12` öffnen → Tab **„Elements"** (oder „Elemente").
4. Auf der Seite rechts oben das **Auswahl-Werkzeug** klicken (Symbol: Pfeil im Quadrat) oder `Strg+Shift+C`.
5. Mit der Maus über das gewünschte Element fahren — es wird im Elements-Panel markiert.
6. **Rechtes Seitenpanel** zeigt unter **„Styles"** die CSS-Regeln und unter **„Computed"** die finalen Werte. **„Computed"** ist meistens, was wir wollen — da steht der echte gerenderte Wert.
7. Werte unten in die Checkliste schreiben.

## Checkliste — bitte ausfüllen

```
== FARBEN ==
[ ] body / Haupt-Wrapper          → background-color:        ________
[ ] body                          → color (Text):            ________
[ ] H1 / Hero "ENERGIZE"          → color:                   ________
[ ] H1 / Hero                     → text-shadow (falls vorh.): ________
[ ] CTA "TICKETS 2026" Button     → background-color:        ________
[ ] CTA "TICKETS 2026" Button     → color (Text auf Button): ________
[ ] CTA Button (hover erzwingen,
    siehe Hinweis unten)          → background-color:        ________
[ ] CTA Button                    → border (full shorthand): ________
[ ] Divider / Trenn-Linie         → border-color:            ________
[ ] Card-Hintergrund (falls vorh.) → background-color:       ________
[ ] Sekundär-Text (z. B. Datum)   → color:                   ________

== TYPOGRAFIE ==
[ ] body                          → font-family:             ________
[ ] H1 / Hero                     → font-family:             ________
[ ] H1 / Hero                     → font-weight:             ________
[ ] H1 / Hero                     → font-size:               ________
[ ] H1 / Hero                     → letter-spacing:          ________
[ ] H1 / Hero                     → line-height:             ________
[ ] H1 / Hero                     → text-transform:          ________
[ ] H2 / Section-Header           → font-family:             ________
[ ] H2 / Section-Header           → font-weight:             ________
[ ] H2                            → font-size:               ________
[ ] Body / Paragraph              → font-size:               ________
[ ] Body                          → line-height:             ________

== BUTTON / SPACING / BORDER ==
[ ] CTA Button                    → padding:                 ________
[ ] CTA Button                    → border-radius:           ________
[ ] CTA Button                    → font-size:               ________
[ ] CTA Button                    → letter-spacing:          ________
[ ] Hero-Container                → padding:                 ________
[ ] Hero-Container                → max-width:               ________

== EFFEKTE ==
[ ] Hero-Hintergrund              → ist Bild oder Video?     ________
[ ] (falls Bild) URL aus DevTools                            ________
[ ] backdrop-filter (falls vorh.) →                          ________
[ ] box-shadow auf Buttons        →                          ________
[ ] transition auf Button-Hover   →                          ________

== LOGO ==
[ ] Header-Logo                   → src URL:                 https://static.wixstatic.com/media/7ff9f3_3b4d1aa6a016441f8819bafae1654ebe~mv2.png
                                  → echte Pixel-Größe (Inspect):  ________ × ________
```

## Hinweis: Hover-Zustand erzwingen

Im **Styles**-Panel oben rechts klick auf `:hov` (oder `:hover` Toggle) → wähle `:hover` aus. Dann zeigt das Panel die Hover-Styles.

## Hinweis: Wix injiziert Styles client-seitig

Wenn du keine Farb-Hex-Werte unter „Styles" siehst, sondern nur `rgb(...)` — das ist normal. Kopier dann den `rgb()`-Wert oder konvertier ihn mit dem Color-Picker daneben in Hex.

## Wenn du fertig bist

Schick mir die ausgefüllte Liste. Ich übernehme sie 1:1 in:

- `packages/design-tokens/src/colors.ts`
- `packages/design-tokens/src/typography.ts`
- `packages/design-tokens/src/spacing.ts`
- `packages/design-tokens/src/radii.ts`
- `packages/design-tokens/src/shadows.ts`
- `packages/design-tokens/src/theme.css` (Tailwind v4 @theme)
- `packages/design-tokens/src/tokens.css` (plain CSS-Vars)

Ein einziger Commit, sofort sichtbar im Hello-World.
