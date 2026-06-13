<script lang="ts">
  import { Hero, Button, Footer, Container } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { urlFor } from '@energize/sanity-client';
  import Countdown from '$lib/Countdown.svelte';
  import AppComingBanner from '$lib/AppComingBanner.svelte';
  import { auth } from '$lib/auth.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const FESTIVAL_DATE = '2027-05-29T14:30:00+02:00';

  const ticketUrl = $derived(data.settings?.ticketUrl ?? 'https://shop.tickee.de/shop/84/');
  const igUrl = $derived(
    data.settings?.socials?.instagram ?? 'https://www.instagram.com/energize_offical/',
  );
  const ytUrl = $derived(data.settings?.socials?.youtube ?? 'https://www.youtube.com/@ENERGIZE-TV');
  const fbUrl = $derived(
    data.settings?.socials?.facebook ?? 'https://www.facebook.com/energize.offical/',
  );

  const featuredArtists = $derived((data.artists ?? []).filter((a) => a.featured).slice(0, 8));

  function photoUrl(photo: unknown): string | null {
    if (!photo) return null;
    try {
      return urlFor(photo).width(450).height(600).fit('crop').auto('format').url();
    } catch {
      return null;
    }
  }
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

  <!-- COUNTDOWN -->
  <section class="border-y border-border bg-surface py-12 md:py-16">
    <Container>
      <div class="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Noch bis zum Festival
          </p>
          <p
            class="mt-2 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
          >
            29. Mai 2027 · 20:00 Uhr
          </p>
        </div>
        <Countdown target={FESTIVAL_DATE} />
      </div>
    </Container>
  </section>

  <!-- HEADLINER-TEASER -->
  {#if featuredArtists.length > 0}
    <section class="py-20 md:py-28">
      <Container>
        <div class="flex items-baseline justify-between">
          <h2
            class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
            style="font-size: clamp(2rem, 5vw, 3.5rem);"
          >
            Headliner <span class="text-accent">2027</span>
          </h2>
          <a
            href="/lineup"
            class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
          >
            Alle ansehen →
          </a>
        </div>

        <ul class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {#each featuredArtists as artist (artist._id)}
            {@const photo = photoUrl(artist.photo)}
            <li>
              <a
                href={`/lineup/${artist.slug}`}
                class="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden border-2 border-fg p-2 transition-all hover:border-accent hover:shadow-[var(--shadow-glow)]"
                class:bg-accent={!photo}
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
                    class="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent"
                    aria-hidden="true"
                  ></div>
                {/if}
                <h3
                  class="relative z-10 font-display font-black uppercase leading-[0.95] tracking-[-0.01em]"
                  style="font-size: clamp(0.7rem, 1.3vw, 0.95rem);"
                  class:text-fg={photo}
                  class:text-fg-inverse={!photo}
                >
                  {artist.name}
                </h3>
              </a>
            </li>
          {/each}
        </ul>
      </Container>
    </section>
  {/if}

  <!-- WAS DICH ERWARTET (3-Spalten) -->
  <section class="border-y border-border bg-surface py-20 md:py-28">
    <Container>
      <h2
        class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        style="font-size: clamp(2rem, 5vw, 3.5rem);"
      >
        Was dich <span class="text-accent">erwartet</span>
      </h2>

      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <article class="border-2 border-fg p-6">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            01 / Stages
          </p>
          <h3
            class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
          >
            Hardstyle First
          </h3>
          <p class="mt-2 text-sm text-fg-muted">
            Eine kompromisslose Bühne für die härteste Musik im Norden — von Raw über Euphoric bis
            Rawphoric.
          </p>
        </article>

        <article class="border-2 border-fg p-6">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            02 / Awareness
          </p>
          <h3
            class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
          >
            Safe Space
          </h3>
          <p class="mt-2 text-sm text-fg-muted">
            Geschultes Awareness-Team vor Ort, 24/7-Hotline, Safe-Zone neben dem Med-Punkt. Du bist
            nie allein.
          </p>
        </article>

        <article class="border-2 border-fg p-6">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            03 / Cashless
          </p>
          <h3
            class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
          >
            Bargeldlos
          </h3>
          <p class="mt-2 text-sm text-fg-muted">
            Wristband statt Geldbeutel. Pre-Topup spart Wartezeit. Restguthaben wird nach dem
            Festival ausgezahlt.
          </p>
        </article>
      </div>
    </Container>
  </section>

  <!-- APP COMING -->
  <AppComingBanner />

  <!-- ACCOUNT-CTA -->
  {#if !auth.user}
    <section class="bg-bg py-20 md:py-28">
      <Container>
        <div class="border-2 border-accent bg-surface p-8 md:p-12">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            Mehr drin mit Account
          </p>
          <h2
            class="mt-3 font-display font-black uppercase leading-[0.95] tracking-[-0.01em] text-fg"
            style="font-size: clamp(2rem, 6vw, 4rem);"
          >
            Markier deine<br />Highlights.
          </h2>
          <p class="mt-4 max-w-xl text-sm text-fg-muted">
            Favoriten speichern, Set-Reminder bekommen, Foto-Wall posten, Cashless-Guthaben checken
            — alles mit einem Magic-Link-Login. Kein Passwort, kein Stress.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <Button href="/login" variant="yellow">{m.nav_login()}</Button>
            <Button href="/lineup" variant="ghost">{m.cta_lineup()}</Button>
          </div>
        </div>
      </Container>
    </section>
  {/if}
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
