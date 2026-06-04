<script lang="ts">
  import { Container, Heading } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { urlFor } from '@energize/sanity-client';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const featured = $derived(data.artists.filter((a) => a.featured));
  const rest = $derived(data.artists.filter((a) => !a.featured));
</script>

<svelte:head>
  <title>{m.nav_lineup()} — ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-16 md:py-24">
    <Heading level={1} display>{m.nav_lineup()}</Heading>
    <p
      class="mt-4 max-w-xl font-mono text-sm uppercase tracking-[var(--tracking-claim)] text-fg-muted"
    >
      {m.hero_claim()}
    </p>

    {#if data.artists.length === 0}
      <div class="mt-12 border-2 border-fg-muted bg-surface p-8 text-center">
        <p class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)]">
          Line-Up wird im Herbst veröffentlicht
        </p>
        <p class="mt-3 text-sm text-fg-muted">
          Die Acts werden ca. 6 Monate vor Festival gebucht. Folgt uns auf Insta für die Drops.
        </p>
      </div>
    {/if}

    {#if featured.length > 0}
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each featured as artist (artist._id)}
          <article class="group relative overflow-hidden border-2 border-fg bg-surface">
            {#if artist.photo}
              <img
                src={urlFor(artist.photo).width(600).height(600).url()}
                alt={artist.name}
                class="aspect-square w-full object-cover"
                loading="lazy"
              />
            {:else}
              <div class="aspect-square w-full bg-surface-alt"></div>
            {/if}
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-4"
            >
              <h3
                class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {artist.name}
              </h3>
              {#if artist.isLive}
                <span
                  class="mt-1 inline-block bg-accent px-2 py-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse"
                >
                  Now Playing
                </span>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}

    {#if rest.length > 0}
      <ul
        class="mt-12 grid gap-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] sm:grid-cols-2 lg:grid-cols-3"
      >
        {#each rest as artist (artist._id)}
          <li class="border-b border-border py-3 text-fg">{artist.name}</li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
