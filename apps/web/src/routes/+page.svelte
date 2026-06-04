<script lang="ts">
  import { Hero, Button, Footer } from '@energize/ui';
  import { m } from '@energize/i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const ticketUrl = $derived(data.settings?.ticketUrl ?? 'https://shop.tickee.de/shop/84/');
  const igUrl = $derived(
    data.settings?.socials?.instagram ?? 'https://www.instagram.com/energize_offical/',
  );
  const ytUrl = $derived(data.settings?.socials?.youtube ?? 'https://www.youtube.com/@ENERGIZE-TV');
  const fbUrl = $derived(
    data.settings?.socials?.facebook ?? 'https://www.facebook.com/energize.offical/',
  );
</script>

<svelte:head>
  <title>{m.hero_headline()} — {m.hero_subline()}</title>
  <meta name="description" content="ENERGIZE Festival — Hardstyle bei Lübeck, 29.05.2027." />
</svelte:head>

<main>
  <Hero
    eyebrow={m.hero_eyebrow()}
    headline={m.hero_headline()}
    subline={m.hero_subline()}
    claim={m.hero_claim()}
  >
    {#snippet actions()}
      <Button href={ticketUrl} variant="yellow">{m.cta_tickets()}</Button>
      <Button href="/lineup" variant="ghost">{m.cta_lineup()}</Button>
    {/snippet}
  </Hero>
</main>

<Footer
  socials={[
    { label: 'Instagram', href: igUrl },
    { label: 'YouTube', href: ytUrl },
    { label: 'Facebook', href: fbUrl },
  ]}
  links={[
    { label: m.footer_imprint(), href: '/impressum' },
    { label: m.footer_privacy(), href: '/datenschutz' },
    { label: m.footer_terms(), href: '/agb' },
  ]}
/>
