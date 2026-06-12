<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { urlFor, pickLocale } from '@energize/sanity-client';
  import { languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import FavoriteButton from '$lib/FavoriteButton.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const locale = $derived(languageTag() as AvailableLanguageTag);

  const bio = $derived(pickLocale(data.artist.bio, locale));

  function photoUrl(): string | null {
    if (!data.artist.photo) return null;
    try {
      return urlFor(data.artist.photo).width(1200).height(1500).auto('format').url();
    } catch {
      return null;
    }
  }

  function timeRange(start?: string, end?: string): string | null {
    if (!start) return null;
    const s = new Date(start);
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const startStr = s.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', opts);
    if (!end) return startStr;
    const e = new Date(end);
    return `${startStr} – ${e.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', opts)}`;
  }

  const slot = $derived(timeRange(data.artist.slotStart, data.artist.slotEnd));
  const photo = $derived(photoUrl());
</script>

<svelte:head>
  <title>{data.artist.name} — ENERGIZE</title>
</svelte:head>

<!-- HERO mit/ohne Foto -->
<section class="relative overflow-hidden border-b border-border">
  {#if photo}
    <img
      src={photo}
      alt={data.artist.name}
      class="absolute inset-0 h-full w-full object-cover opacity-50"
    />
    <div
      class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30"
      aria-hidden="true"
    ></div>
  {:else}
    <div class="absolute inset-0 bg-accent" aria-hidden="true"></div>
    <div
      class="pointer-events-none absolute inset-0"
      style="background-image: repeating-linear-gradient(135deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 14px);"
      aria-hidden="true"
    ></div>
  {/if}

  <Container>
    <div class="relative py-24 md:py-32">
      <a
        href="/lineup"
        class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] transition-colors {photo
          ? 'text-fg-muted hover:text-accent'
          : 'text-fg-inverse/70 hover:text-fg-inverse'}"
      >
        ← Lineup
      </a>

      <div class="mt-6 flex items-start justify-between gap-6">
        <h1
          class="font-display font-black uppercase leading-[0.85] tracking-[-0.02em]"
          style="font-size: clamp(2.5rem, 11vw, 8rem);"
          class:text-fg={photo}
          class:text-fg-inverse={!photo}
        >
          {data.artist.name}
        </h1>
        <div class="shrink-0 pt-3">
          <FavoriteButton artistId={data.artist._id} onDark={!photo ? false : true} />
        </div>
      </div>

      {#if data.artist.isLive}
        <p class="mt-6">
          <span
            class="inline-block animate-pulse bg-danger px-2 py-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg"
          >
            ● LIVE
          </span>
        </p>
      {/if}

      {#if slot}
        <p
          class="mt-4 font-mono text-sm uppercase tracking-[var(--tracking-claim)]"
          class:text-fg={photo}
          class:text-fg-inverse={!photo}
        >
          ⏱ {slot}
        </p>
      {/if}
    </div>
  </Container>
</section>

<!-- BIO + LINKS -->
<Container>
  <section class="grid gap-12 py-20 md:grid-cols-[2fr_1fr] md:py-28">
    <div>
      {#if bio}
        <h2 class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          Bio
        </h2>
        <p class="mt-4 whitespace-pre-line text-base leading-relaxed text-fg md:text-lg">
          {bio}
        </p>
      {:else}
        <p class="text-fg-muted">Bio folgt.</p>
      {/if}
    </div>

    <aside>
      {#if data.artist.links && (data.artist.links.spotify || data.artist.links.soundcloud || data.artist.links.instagram || data.artist.links.youtube)}
        <h2 class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          Hör rein
        </h2>
        <ul class="mt-4 space-y-2">
          {#each Object.entries(data.artist.links).filter(([, v]) => !!v) as [platform, url] (platform)}
            <li>
              <a
                href={url}
                target="_blank"
                rel="noopener"
                class="group flex items-center justify-between border-2 border-border bg-surface px-4 py-3 transition-all hover:border-accent hover:shadow-[var(--shadow-glow)]"
              >
                <span
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted group-hover:text-accent"
                >
                  {platform}
                </span>
                <span
                  class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg group-hover:text-accent"
                >
                  →
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="mt-8">
        <Button href="/lineup" variant="ghost">← Alle Acts</Button>
      </div>
    </aside>
  </section>
</Container>
