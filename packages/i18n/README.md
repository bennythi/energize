# @energize/i18n

DE + EN Strings auf Paraglide-JS-Basis (compile-time, tree-shakable).

## Strings hinzufügen / ändern

1. Key in `messages/de.json` und `messages/en.json` ergänzen — Schema ist flach (`snake_case_key: "Text"`).
2. `pnpm --filter @energize/i18n build` regeneriert `src/paraglide/`.
3. In Apps importieren:
   ```ts
   import { m, setLanguageTag } from '@energize/i18n';
   m.hero_headline();
   setLanguageTag('en');
   ```

## Wichtig

- `src/paraglide/` ist generierter Code → in `.gitignore`, nicht commiten.
- `postinstall` führt den Compile aus, damit die Pakete nach `pnpm install` sofort lauffähig sind.
