# Sanity Seed-Daten

Initialer Inhalt für das Energize-Dataset — basierend auf den Briefing-Inhalten vom 2026er Festival, angepasst auf 2027 wo sinnvoll (Edition, Datum bleibt im siteSettings-Feld festzulegen).

## Inhalt

- 1 × `siteSettings` (Singleton) — Festival-Name, Edition 2027, Venue-Adresse Am Dorfteich 4 / 23617 Dissau, Tickee-/Cashless-URLs, Twitch-Channel `beatfighterz`, Social-Links
- 16 × `faqEntry` — Tickets (2), Cashless (3), Anreise (4), Hausordnung (3), Allgemeines (4)

⚠️ Alle Strings nur in **`de`** — die `en`-Felder bleiben leer und werden später separat befüllt.

## Import-Befehl

Voraussetzung: Sanity-CLI ist via `pnpm install` schon da. Login einmalig:

```powershell
pnpm --filter @energize/studio exec sanity login
```

Dann Import in das `production`-Dataset:

```powershell
pnpm --filter @energize/studio exec sanity dataset import apps/studio/seed/baseline.ndjson production
```

Sanity fragt vor dem Import:

- **Overwrite existing documents?** → `yes`, wenn du ein zweites Mal seedest (oder `no`, dann meckert es nur über bestehende IDs).
- **Generate missing references?** → keine vorhanden, ist egal.

Im Browser → `https://oxliq7rf.sanity.studio/` (nach `pnpm --filter @energize/studio deploy`) oder lokal via `pnpm --filter @energize/studio dev`.

## Was du nach dem Import noch anpassen solltest

In **Website-Einstellungen**:

- `Festival-Beginn` (Datetime) auf Sa 29.05.2027 14:30 setzen (oder das echte 2027er Datum).
- `Festival-Ende` auf 24:00 desselben Tags.
- `Warm-Up Twitch-Stream Start`, `Ritual & Official Opening`, `Big Bang Endshow` analog.
- `Parkticket-URL` und `Shuttleticket-URL` — sobald die Deep-Links im Tickee-Shop für 2027 stehen.
- `Saison-Motto` für 2027 (2026 war „The Ultimate Reality").

In **FAQ** (gleich nach Import):

- Lese durch, ob die Wortlaute passen.
- Wenn Edition 2027 abweicht (z. B. anderes Doors-Open, anderer Shuttle-Ablauf), entsprechende Einträge editieren.

## Wiederholtes Seeden

NDJSON nutzt feste `_id`s (z. B. `faq-tageskasse`). Beim erneuten Import mit `--replace` werden bestehende überschrieben:

```powershell
pnpm --filter @energize/studio exec sanity dataset import apps/studio/seed/baseline.ndjson production --replace
```

Damit kannst du die Seed-Datei als „Single Source of Truth" für den initialen Stand benutzen.
