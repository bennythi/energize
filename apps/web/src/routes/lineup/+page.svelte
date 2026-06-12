<script lang="ts">
  import { Container, Heading } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { urlFor } from '@energize/sanity-client';
  import FavoriteButton from '$lib/FavoriteButton.svelte';
  import { auth } from '$lib/auth.svelte';
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
    {:else}
      <div role="note" class="mt-8 border-2 border-accent bg-accent/10 p-4 text-sm text-fg">
        <p
          class="font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {m.lineup_demo_banner_title()}
        </p>
        <p class="mt-1 text-fg-muted">{m.lineup_demo_banner_body()}</p>
      </div>
    {/if}

    {#if !auth.user && data.artists.length > 0}
      <p class="mt-6 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        <a href="/login" class="hover:text-accent transition-colors">→ {m.favorites_login_hint()}</a
        >
      </p>
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
            <div class="absolute right-3 top-3 z-10">
              <FavoriteButton artistId={artist._id} onDark />
            </div>
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
      <ul class="mt-12 divide-y divide-border border-y border-border">
        {#each rest as artist (artist._id)}
          <li class="flex items-center justify-between gap-4 py-3">
            <span
              class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
            >
              {artist.name}
            </span>
            <FavoriteButton artistId={artist._id} size="sm" />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
