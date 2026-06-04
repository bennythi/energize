<script lang="ts">
  import { Container, Heading, Button } from '@energize/ui';
  import { pickLocale } from '@energize/sanity-client';
  import { languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const locale = $derived(languageTag() as AvailableLanguageTag);
  const addr = $derived(data.settings?.venueAddress);
  const mapsQuery = $derived(
    addr
      ? encodeURIComponent(
          `${addr.street ?? ''} ${addr.postalCode ?? ''} ${addr.city ?? ''}`.trim(),
        )
      : '',
  );
</script>

<svelte:head>
  <title>Anfahrt — ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-16 md:py-24">
    <Heading level={1} display>Anfahrt</Heading>

    {#if addr}
      <div class="mt-8 border-2 border-accent bg-surface p-6">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          Adresse
        </p>
        <p
          class="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-[var(--tracking-claim)] text-fg"
        >
          {addr.street}<br />
          {addr.postalCode}
          {addr.city}
        </p>
        {#if addr.region}
          <p class="mt-2 text-sm text-fg-muted">{addr.region}</p>
        {/if}

        {#if mapsQuery}
          <div class="mt-6 flex flex-wrap gap-3">
            <Button
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
              variant="yellow"
            >
              Route Google
            </Button>
            <Button href={`https://maps.apple.com/?daddr=${mapsQuery}`} variant="ghost">
              Route Apple
            </Button>
          </div>
        {/if}
      </div>
    {/if}

    <div class="mt-12 grid gap-4 sm:grid-cols-2">
      {#if data.settings?.parkingTicketUrl}
        <a
          href={data.settings.parkingTicketUrl}
          target="_blank"
          rel="noopener"
          class="block border-2 border-fg bg-surface p-6 transition-colors hover:bg-accent hover:text-fg-inverse"
        >
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            🅿️ PKW
          </p>
          <p
            class="mt-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)]"
          >
            Parkticket kaufen
          </p>
        </a>
      {/if}
      {#if data.settings?.shuttleTicketUrl}
        <a
          href={data.settings.shuttleTicketUrl}
          target="_blank"
          rel="noopener"
          class="block border-2 border-fg bg-surface p-6 transition-colors hover:bg-accent hover:text-fg-inverse"
        >
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            🚌 Lübeck Hbf
          </p>
          <p
            class="mt-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)]"
          >
            Shuttleticket
          </p>
        </a>
      {/if}
    </div>

    {#if data.anreiseFaq.length > 0}
      <ul class="mt-12 divide-y divide-border border-y border-border">
        {#each data.anreiseFaq as entry (entry._id)}
          <li>
            <details class="group p-4 transition-colors hover:bg-surface">
              <summary
                class="cursor-pointer list-none font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {pickLocale(entry.question, locale)}
              </summary>
              <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
                {pickLocale(entry.answer, locale)}
              </p>
            </details>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
