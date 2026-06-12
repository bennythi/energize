<script lang="ts">
  import { Container } from '@energize/ui';
  import { pickLocale, type PoiType } from '@energize/sanity-client';
  import { languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const locale = $derived(languageTag() as AvailableLanguageTag);

  const typeLabels: Record<PoiType, { de: string; en: string; icon: string }> = {
    stage: { de: 'Bühne', en: 'Stage', icon: '🎚' },
    toilet: { de: 'WC', en: 'Toilets', icon: '⚿' },
    medic: { de: 'Sanitäter', en: 'Medic', icon: '✚' },
    bar: { de: 'Bar', en: 'Bar', icon: '🍺' },
    food: { de: 'Essen', en: 'Food', icon: '⌽' },
    entry: { de: 'Eingang', en: 'Entry', icon: '⊳' },
    cashless: { de: 'Cashless-Topup', en: 'Cashless top-up', icon: '$' },
    parking: { de: 'Parkplatz', en: 'Parking', icon: 'P' },
    info: { de: 'Info', en: 'Info', icon: 'i' },
    other: { de: 'Sonstiges', en: 'Other', icon: '•' },
  };

  function typeLabel(type: PoiType): string {
    const entry = typeLabels[type] ?? typeLabels.other;
    return locale === 'en' ? entry.en : entry.de;
  }

  const grouped = $derived.by(() => {
    const groups: Record<string, typeof data.pois> = {};
    for (const poi of data.pois) {
      (groups[poi.type] ??= []).push(poi);
    }
    return Object.entries(groups);
  });
</script>

<svelte:head>
  <title>Karte — ENERGIZE</title>
</svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <Container>
    <div class="relative py-16 md:py-24">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Gelände
      </p>
      <h1
        class="mt-4 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 8vw, 5rem);"
      >
        Festival-Karte
      </h1>
      <p class="mt-4 max-w-2xl text-sm text-fg-muted md:text-base">
        Stages, Bars, WCs, Medic, Cashless-Topup. Offline verfügbar — auch ohne Netz auf dem
        Gelände.
      </p>
    </div>
  </Container>
</section>

<!-- KARTEN-PLACEHOLDER (Inline-SVG) -->
<Container>
  <section class="py-12">
    <div class="relative aspect-[16/10] w-full overflow-hidden border-2 border-fg bg-surface">
      <svg
        viewBox="0 0 1600 1000"
        xmlns="http://www.w3.org/2000/svg"
        class="h-full w-full"
        role="img"
        aria-label="Geländekarte Platzhalter"
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              stroke-width="1"
            />
          </pattern>
        </defs>
        <rect width="1600" height="1000" fill="url(#grid)" />

        <!-- Main Stage -->
        <rect x="600" y="120" width="400" height="160" fill="#FFEC00" />
        <text
          x="800"
          y="215"
          fill="#0A0A0A"
          font-family="Barlow Condensed"
          font-weight="900"
          font-size="42"
          text-anchor="middle"
          letter-spacing="4"
        >
          MAIN STAGE
        </text>

        <!-- Side Stage -->
        <rect x="120" y="640" width="280" height="120" fill="#FFEC00" opacity="0.75" />
        <text
          x="260"
          y="710"
          fill="#0A0A0A"
          font-family="Barlow Condensed"
          font-weight="900"
          font-size="28"
          text-anchor="middle"
          letter-spacing="3"
        >
          SIDE STAGE
        </text>

        <!-- Eingang -->
        <circle cx="800" cy="900" r="30" fill="none" stroke="#FFEC00" stroke-width="4" />
        <text
          x="800"
          y="965"
          fill="#F5F5F2"
          font-family="JetBrains Mono"
          font-size="20"
          text-anchor="middle"
          letter-spacing="2"
        >
          ENTRY
        </text>

        <!-- Bar Hotspots -->
        {#each [{ x: 400, y: 380 }, { x: 1200, y: 380 }, { x: 1200, y: 740 }] as bar, i (i)}
          <circle cx={bar.x} cy={bar.y} r="18" fill="#FFEC00" />
          <text
            x={bar.x}
            y={bar.y + 5}
            fill="#0A0A0A"
            font-family="JetBrains Mono"
            font-weight="700"
            font-size="20"
            text-anchor="middle"
          >
            B
          </text>
        {/each}

        <!-- WCs -->
        {#each [{ x: 200, y: 200 }, { x: 1400, y: 200 }, { x: 1400, y: 800 }] as wc, i (i)}
          <rect x={wc.x - 14} y={wc.y - 14} width="28" height="28" fill="#666666" />
          <text
            x={wc.x}
            y={wc.y + 5}
            fill="#F5F5F2"
            font-family="JetBrains Mono"
            font-weight="700"
            font-size="18"
            text-anchor="middle"
          >
            WC
          </text>
        {/each}

        <!-- Medic -->
        <rect x="80" y="80" width="40" height="40" fill="#E24B4A" />
        <text
          x="100"
          y="110"
          fill="#F5F5F2"
          font-family="JetBrains Mono"
          font-weight="700"
          font-size="24"
          text-anchor="middle"
        >
          ✚
        </text>

        <!-- Demo-Badge -->
        <text
          x="800"
          y="500"
          fill="rgba(255,236,0,0.15)"
          font-family="Barlow Condensed"
          font-weight="900"
          font-size="120"
          text-anchor="middle"
          letter-spacing="8"
        >
          DEMO MAP
        </text>
      </svg>

      <p
        class="absolute bottom-4 left-4 border-2 border-accent bg-bg px-3 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        ⚡ Platzhalter — finale Karte folgt
      </p>
    </div>
  </section>
</Container>

<!-- POI-LISTE -->
{#if data.pois.length > 0}
  <Container>
    <section class="py-20">
      <h2
        class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        style="font-size: clamp(2rem, 5vw, 3rem);"
      >
        Alle Punkte
      </h2>
      <div class="mt-8 space-y-12">
        {#each grouped as [type, pois] (type)}
          <div>
            <h3
              class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
            >
              {typeLabel(type as PoiType)}
            </h3>
            <ul class="mt-4 divide-y divide-border border-y border-border">
              {#each pois as poi (poi._id)}
                <li class="flex items-baseline justify-between gap-4 py-3">
                  <span
                    class="font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                  >
                    {pickLocale(poi.name, locale) ?? '—'}
                  </span>
                  {#if poi.description}
                    <span class="text-right text-sm text-fg-muted">
                      {pickLocale(poi.description, locale)}
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>
  </Container>
{:else}
  <Container>
    <section class="py-20">
      <div class="border-2 border-fg-muted bg-surface p-8 text-center">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          POIs werden noch gepflegt
        </p>
        <p
          class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Genaue Punkte folgen Anfang 2027
        </p>
      </div>
    </section>
  </Container>
{/if}
