<script lang="ts">
  import { Container } from '@energize/ui';

  interface Video {
    id: string; // YouTube-ID
    title: string;
    edition: string;
    type: 'aftermovie' | 'endshow' | 'anthem' | 'other';
    description: string;
  }

  // Quelle: https://www.energize-festival.de/media (2026er Wix-Build)
  const videos: Video[] = [
    {
      id: 'zxDDNAXQJKo',
      title: 'Beatfighterz & Ruffian — The Ultimate Reality',
      edition: '2026',
      type: 'anthem',
      description: 'Festival-Hymne zum Energize 2026.',
    },
    {
      id: 'l-xmM7T0e4Y',
      title: 'The Endshow',
      edition: '2025',
      type: 'endshow',
      description: 'Abschluss-Show des Outdoor-Festivals 2025.',
    },
    {
      id: 'FXTarp25oxg',
      title: 'Rise of Redemption — Official Aftermovie',
      edition: '2025',
      type: 'aftermovie',
      description: 'Offizielles Aftermovie der 2025er Edition.',
    },
    {
      id: 'YB7AVnAslAs',
      title: 'The Yellow Insanity — Official Aftermovie',
      edition: '2024',
      type: 'aftermovie',
      description: 'Offizielles Aftermovie der 2024er Edition.',
    },
    {
      id: 'gjcLA2JC8g4',
      title: 'The Endshow',
      edition: '2023',
      type: 'endshow',
      description: 'Abschluss-Show des Outdoor-Festivals 2023.',
    },
    {
      id: 'PESAbBaToSE',
      title: 'The Edge of Nowhere — Aftermovie',
      edition: '2023',
      type: 'aftermovie',
      description: 'Offizielles Aftermovie der 2023er Edition.',
    },
    {
      id: 'YPH_4qeUsJs',
      title: 'The Endshow',
      edition: '2022',
      type: 'endshow',
      description: 'Abschluss-Show des Outdoor-Festivals 2022.',
    },
  ];

  let filter = $state<'all' | 'aftermovie' | 'endshow' | 'anthem'>('all');

  const filtered = $derived(filter === 'all' ? videos : videos.filter((v) => v.type === filter));

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'aftermovie', label: 'Aftermovies' },
    { value: 'endshow', label: 'Endshows' },
    { value: 'anthem', label: 'Anthems' },
  ];

  function thumbUrl(id: string): string {
    return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  }

  function watchUrl(id: string): string {
    return `https://www.youtube.com/watch?v=${id}`;
  }
</script>

<svelte:head>
  <title>Media — ENERGIZE</title>
</svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.04]"
    style="background-image: repeating-linear-gradient(135deg, var(--color-accent) 0 2px, transparent 2px 18px);"
    aria-hidden="true"
  ></div>

  <Container>
    <div class="relative py-20 md:py-32">
      <p
        class="enter-up stagger-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        ⚡ Archiv
      </p>
      <h1
        class="enter-up stagger-2 mt-6 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 9vw, 7rem);"
      >
        Media
      </h1>
      <p class="enter-up stagger-3 mt-6 max-w-2xl text-base text-fg-muted md:text-lg">
        Aftermovies, Endshows und Festival-Hymnen aus allen bisherigen Editionen. Klick auf die
        Vorschau, öffnet auf YouTube.
      </p>
    </div>
  </Container>
</section>

<!-- FILTER -->
<Container>
  <section class="py-12">
    <ul class="flex flex-wrap gap-2">
      {#each filters as f (f.value)}
        <li>
          <button
            type="button"
            onclick={() => (filter = f.value)}
            class="border-2 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] transition-colors"
            class:border-accent={filter === f.value}
            class:bg-accent={filter === f.value}
            class:text-fg-inverse={filter === f.value}
            class:border-border={filter !== f.value}
            class:text-fg-muted={filter !== f.value}
          >
            {f.label}
          </button>
        </li>
      {/each}
    </ul>

    <ul class="stagger-list mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as video (video.id)}
        <li>
          <a
            href={watchUrl(video.id)}
            target="_blank"
            rel="noopener"
            class="card-press group flex h-full flex-col overflow-hidden border-2 border-border bg-surface"
          >
            <div class="relative aspect-video overflow-hidden bg-bg">
              <img
                src={thumbUrl(video.id)}
                alt={video.title}
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <!-- Play-Overlay -->
              <div class="absolute inset-0 flex items-center justify-center">
                <span
                  class="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-fg-inverse transition-all group-hover:scale-110"
                  aria-hidden="true"
                >
                  <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor">
                    <polygon points="2,1 19,11 2,21" />
                  </svg>
                </span>
              </div>
              <!-- Edition Badge -->
              <span class="absolute left-3 top-3 plakat px-2 py-1 font-mono text-[10px]">
                {video.edition}
              </span>
            </div>

            <div class="flex flex-1 flex-col gap-2 p-4">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
              >
                {video.type === 'aftermovie'
                  ? 'Aftermovie'
                  : video.type === 'endshow'
                    ? 'Endshow'
                    : video.type === 'anthem'
                      ? 'Anthem'
                      : 'Video'}
              </p>
              <h3
                class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] leading-tight text-fg"
              >
                {video.title}
              </h3>
              <p class="text-sm text-fg-muted">{video.description}</p>
              <p
                class="mt-auto pt-3 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted group-hover:text-accent"
              >
                ↗ Auf YouTube ansehen
              </p>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </section>
</Container>

<!-- Galerien-Hinweis -->
<section class="border-y border-border bg-surface py-16">
  <Container>
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      Foto-Galerien
    </p>
    <h2
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(1.75rem, 4vw, 2.75rem);"
    >
      Outdoor Festival · Indoor Rave
    </h2>
    <p class="mt-4 max-w-2xl text-base text-fg-muted">
      Die offiziellen Galerien beider Reihen liegen aktuell noch auf der
      <a
        href="https://www.energize-festival.de/media"
        target="_blank"
        rel="noopener"
        class="text-accent hover:underline">2026er Wix-Site</a
      >. Sobald die Inhalte nach Sanity migriert sind, erscheinen sie hier mit Lightbox.
    </p>
  </Container>
</section>
