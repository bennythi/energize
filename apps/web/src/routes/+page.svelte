<script lang="ts">
  import { Hero, Button, Footer } from '@energize/ui';
  import { m, setLanguageTag, languageTag, type AvailableLanguageTag } from '@energize/i18n';

  let currentLang = $state<AvailableLanguageTag>(languageTag() as AvailableLanguageTag);

  function toggleLang() {
    const next: AvailableLanguageTag = currentLang === 'de' ? 'en' : 'de';
    setLanguageTag(next);
    currentLang = next;
  }
</script>

<svelte:head>
  <title>{m.hero_headline()} — {m.hero_subline()}</title>
</svelte:head>

<header class="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
  <span class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)]">
    {m.hero_headline()}
  </span>
  <button
    onclick={toggleLang}
    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-fg transition-colors"
    aria-label="Toggle language"
  >
    {m.lang_current()} → {m.lang_toggle()}
  </button>
</header>

<main>
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
      <Button href="#lineup" variant="ghost">{m.cta_lineup()}</Button>
    {/snippet}
  </Hero>

  <section class="bg-bg py-12 text-center">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      {m.hello_world_web()}
    </p>
  </section>
</main>

<Footer
  socials={[
    { label: 'Instagram', href: 'https://www.instagram.com/energize_offical/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@ENERGIZE-TV' },
    { label: 'Facebook', href: 'https://www.facebook.com/energize.offical/' },
  ]}
  links={[
    { label: m.footer_imprint(), href: '/impressum' },
    { label: m.footer_privacy(), href: '/datenschutz' },
    { label: m.footer_terms(), href: '/agb' },
    { label: m.footer_cashless_terms(), href: '/cashless-agb' },
  ]}
/>
