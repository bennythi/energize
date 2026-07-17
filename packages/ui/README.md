# @energize/ui

Geteilte Svelte-5-Komponenten für `apps/web` und `apps/app`.

## Komponenten (Phase 1)

- `Container` — max-width Wrapper mit responsive padding (sm/md/lg/full)
- `Heading` — h1–h4, optional display-font (Barlow Condensed)
- `Button` — primary/ghost, als `<a>` oder `<button>`
- `Hero` — Hero-Section mit eyebrow/headline/subline/claim/actions Snippets
- `Footer` — Social-Bar + rechtliche Links + Copyright

Alle Komponenten konsumieren Tailwind-Klassen mit Tokens aus `@energize/design-tokens`.

## Beispiel

```svelte
<script lang="ts">
  import { Hero, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
</script>

<Hero
  eyebrow={m.hero_eyebrow()}
  headline={m.hero_headline()}
  subline={m.hero_subline()}
  claim={m.hero_claim()}
>
  {#snippet actions()}
    <Button href="https://shop.tickee.de/shop/84/" variant="primary">
      {m.cta_tickets()}
    </Button>
    <Button href="/lineup" variant="ghost">{m.cta_lineup()}</Button>
  {/snippet}
</Hero>
```
