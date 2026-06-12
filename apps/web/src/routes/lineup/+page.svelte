<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { urlFor } from '@energize/sanity-client';
  import FavoriteButton from '$lib/FavoriteButton.svelte';
  import { auth } from '$lib/auth.svelte';
  import { favorites } from '$lib/favorites.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const artists = $derived(data.artists ?? []);
  const headliners = $derived(artists.filter((a) => a.featured));
  const rest = $derived(artists.filter((a) => !a.featured));
  const alphabetical = $derived([...artists].sort((a, b) => a.name.localeCompare(b.name, 'de')));

  function photoUrl(photo: unknown, w = 800, h = 800): string | null {
    if (!photo) return null;
    try {
      return urlFor(photo).width(w).height(h).fit('crop').auto('format').url();
    } catch {
      return null;
    }
  }
</script>

<svelte:head>
  <title>{m.nav_lineup()} — ENERGIZE 2027</title>
</svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <!-- Hintergrund-Diagonale -->
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.04]"
    style="background-image: repeating-linear-gradient(135deg, var(--color-accent) 0 2px, transparent 2px 18px);"
    aria-hidden="true"
  ></div>

  <Container>
    <div class="relative py-20 md:py-32">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        29.05.2027 · Stockelsdorf / Dissau
      </p>

      <h1
        class="mt-6 font-display font-black uppercase leading-[0.85] tracking-[-0.02em] text-fg"
        style="font-size: clamp(4rem, 14vw, 12rem);"
      >
        Line<span class="text-accent">/</span>Up
      </h1>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <span class="plakat px-3 py-1 text-base">2027</span>
        <span
          class="border-2 border-fg-muted px-3 py-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
        >
          {m.hero_claim()}
        </span>
      </div>
    </div>
  </Container>
</section>

<!-- DEMO-BANNER -->
{#if artists.length > 0}
  <div role="note" class="border-y-2 border-accent bg-accent text-fg-inverse">
    <Container>
      <div class="flex flex-col gap-1 py-3 md:flex-row md:items-baseline md:gap-4">
        <span class="font-display text-sm font-black uppercase tracking-[var(--tracking-claim)]">
          ⚡ {m.lineup_demo_banner_title()}
        </span>
        <span class="text-xs opacity-80 md:text-sm">{m.lineup_demo_banner_body()}</span>
      </div>
    </Container>
  </div>
{/if}

<!-- ERROR / EMPTY STATES -->
{#if data.loadError}
  <Container>
    <div class="my-12 border-2 border-danger bg-surface p-8">
      <p
        class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-danger"
      >
        Lineup konnte nicht geladen werden
      </p>
      <p class="mt-2 text-sm text-fg-muted">
        Bitte Seite neu laden. Falls der Fehler bleibt, prüfe deine Internet-Verbindung.
      </p>
      <p class="mt-2 font-mono text-xs text-fg-muted">{data.loadError}</p>
    </div>
  </Container>
{:else if artists.length === 0}
  <Container>
    <div class="my-12 border-2 border-fg-muted bg-surface p-8 text-center">
      <p class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)]">
        Line-Up wird im Herbst veröffentlicht
      </p>
      <p class="mt-3 text-sm text-fg-muted">Die Acts werden ca. 6 Monate vor Festival gebucht.</p>
    </div>
  </Container>
{:else}
  <!-- LOGIN-HINT -->
  {#if !auth.user}
    <Container>
      <div class="mt-10 flex items-center justify-between border-l-4 border-accent pl-4">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          {m.favorites_login_hint()} → markiere deine Highlights für 2027
        </p>
        <a
          href="/login"
          class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent transition-colors hover:underline"
        >
          {m.nav_login()}
        </a>
      </div>
    </Container>
  {/if}

  <!-- HEADLINER GRID -->
  {#if headliners.length > 0}
    <Container>
      <div class="mt-16 flex items-baseline justify-between">
        <h2
          class="font-display text-3xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-4xl"
        >
          Headliner
        </h2>
        <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          {headliners.length}
          {headliners.length === 1 ? 'Act' : 'Acts'}
        </span>
      </div>

      <ul
        class="mt-8 grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
      >
        {#each headliners as artist, idx (artist._id)}
          {@const photo = photoUrl(artist.photo, 400, 400)}
          {@const isFav = favorites.has(artist._id)}
          <li class="relative">
            <a
              href={`/lineup/${artist.slug}`}
              class="group relative flex aspect-square flex-col justify-between overflow-hidden border-2 border-fg p-2 transition-all hover:border-accent hover:shadow-[var(--shadow-glow)]"
              class:bg-accent={!photo}
              class:text-fg-inverse={!photo}
              class:bg-surface={photo}
            >
              {#if photo}
                <img
                  src={photo}
                  alt={artist.name}
                  loading="lazy"
                  class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent"
                  aria-hidden="true"
                ></div>
              {:else}
                <!-- Plakat-Style: Schwarz auf Gelb -->
                <div class="absolute inset-0" aria-hidden="true">
                  <div
                    class="absolute -bottom-4 -right-4 font-display text-[5rem] font-black leading-none text-fg-inverse opacity-10"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>
              {/if}

              <!-- TOP: Nummer + Live-Badge -->
              <div class="relative z-10 flex items-start justify-between gap-1">
                <span
                  class="font-mono text-[9px] uppercase tracking-[var(--tracking-claim)] {photo
                    ? 'text-fg/80'
                    : 'text-fg-inverse/70'}"
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {#if artist.isLive}
                  <span
                    class="animate-pulse bg-danger px-1 py-0.5 font-mono text-[8px] uppercase tracking-[var(--tracking-claim)] text-fg"
                  >
                    ●
                  </span>
                {/if}
              </div>

              <!-- BOTTOM: Name + Fav-Stern -->
              <div class="relative z-10 mt-auto flex items-end justify-between gap-1">
                <h3
                  class="font-display font-black uppercase leading-[0.95] tracking-[-0.01em]"
                  style="font-size: clamp(0.7rem, 1.4vw, 1rem);"
                  class:text-fg={photo}
                  class:text-fg-inverse={!photo}
                >
                  {artist.name}
                </h3>
                {#if isFav}
                  <span
                    class="font-mono text-[10px] leading-none"
                    class:text-accent={photo}
                    class:text-fg-inverse={!photo}
                  >
                    ★
                  </span>
                {/if}
              </div>
            </a>

            <!-- Favorite-Button als Overlay (clickable, separat vom Link) -->
            <div class="absolute right-1 top-1 z-20">
              <FavoriteButton artistId={artist._id} size="sm" onDark={!!photo} />
            </div>
          </li>
        {/each}
      </ul>
    </Container>
  {/if}

  <!-- WEITERE ACTS (rest) -->
  {#if rest.length > 0}
    <Container>
      <h2
        class="mt-20 font-display text-3xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-4xl"
      >
        Weitere Acts
      </h2>
      <ul class="mt-6 divide-y divide-border border-y-2 border-border">
        {#each rest as artist (artist._id)}
          <li class="flex items-center justify-between gap-4 py-4">
            <span
              class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-2xl"
            >
              {artist.name}
            </span>
            <FavoriteButton artistId={artist._id} size="sm" />
          </li>
        {/each}
      </ul>
    </Container>
  {/if}

  <!-- ALPHABETISCHER INDEX -->
  {#if alphabetical.length > 6}
    <Container>
      <details class="mt-20 group">
        <summary
          class="cursor-pointer list-none border-y border-border py-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
        >
          <span class="inline-block transition-transform group-open:rotate-90">▶</span>
          Alle Acts A–Z anzeigen
        </summary>
        <div class="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {#each alphabetical as artist (artist._id)}
            <span
              class="block border-b border-border py-2 font-mono text-sm uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              {artist.name}
            </span>
          {/each}
        </div>
      </details>
    </Container>
  {/if}

  <!-- BOTTOM CTA -->
  {#if !auth.user}
    <Container>
      <div class="mt-20 mb-20 border-2 border-accent bg-surface p-8 text-center">
        <p
          class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
        >
          Markier deine Highlights.
        </p>
        <p class="mt-3 text-sm text-fg-muted">
          Mit Account siehst du deine Favoriten gesammelt — und bekommst Set-Reminder.
        </p>
        <div class="mt-6">
          <Button href="/login" variant="yellow">{m.nav_login()}</Button>
        </div>
      </div>
    </Container>
  {:else}
    <div class="h-20"></div>
  {/if}
{/if}
