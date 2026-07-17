# Sanity-Setup

**Ziel:** Sanity-Projekt im Free-Tier anlegen, Project-ID + Dataset-Name in unser Studio einsetzen, sodass `pnpm --filter @energize/studio dev` lokal läuft.

**Dauer:** ~15 Minuten.

## 1. Sanity-Account anlegen

1. Öffne **https://www.sanity.io/login**.
2. „Sign up with Google" oder „Sign up with E-Mail" — wir empfehlen **E-Mail** auf eine Brainchildz-Adresse (z. B. `tech@brainchildz.de` oder ähnliche), damit der Account später dem Team gehört, nicht dir persönlich.
3. Bestätige die E-Mail.

## 2. Projekt anlegen

1. Im Dashboard auf **„Create new project"** (oder „Neues Projekt").
2. Name: **`ENERGIZE Festival`**
3. Organization: bleibt **„Personal"** für Phase 1; in Phase 2 kannst du eine „Brainchildz"-Organization anlegen und das Projekt rüberziehen.
4. **Dataset**: `production` (Default akzeptieren).
5. **Plan**: **Free** (Default).
6. Nach Abschluss zeigt die Übersicht eine **Project ID** wie `abc1xyz9`. **Kopieren!**

## 3. Project-ID in unseren Code einsetzen

Öffne im Editor (z. B. VS Code):

- `apps/studio/sanity.config.ts` → `projectId: 'REPLACE_WITH_SANITY_PROJECT_ID'` ersetzen
- `apps/studio/sanity.cli.ts` → identisch

Beispiel:

```ts
projectId: 'abc1xyz9',
dataset: 'production',
```

## 4. Studio lokal starten

```powershell
pnpm install                              # nur falls noch nicht passiert
pnpm --filter @energize/studio dev
```

Im Browser öffnet sich `http://localhost:3333`. Da Phase 1 keine Schemas hat, siehst du eine leere Übersicht — das ist okay. In Phase 2 kommen die Inhalte (`siteSettings`, `artist`, `stage`, `faqEntry`, `poi`, `sponsor`, `mediaItem`).

## 5. (Optional, Phase 2) Studio auf Sanity Cloud deployen

```powershell
pnpm --filter @energize/studio deploy
```

Beim ersten Mal fragt Sanity nach einer **Studio-Hostname**. Empfehlung: `energize` → URL wird `https://energize.sanity.studio`.

## 6. Internationalization-Plugin (Phase 2)

Für DE + EN-Inhalte:

- In Phase 2 installieren wir `@sanity/document-internationalization` und konfigurieren es so, dass Lineup/FAQ/Pages parallel auf DE und EN pflegbar sind.
- Project-IDs und Datasets bleiben gleich, nur Schema-Definitionen ändern sich.

## Sicherheit

- Project-ID ist **public** (im Frontend sichtbar) — kein Geheimnis.
- Sanity-API-Token (wenn wir in Phase 2 schreibend zugreifen) **wird** ein Geheimnis und wandert in `.env.local` (nicht commited).
