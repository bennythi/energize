<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';

  interface LocationRow {
    country: string;
    region: string;
    count: number;
  }

  let data = $state<LocationRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  async function load() {
    const client = auth.client;
    if (!client) {
      loading = false;
      return;
    }
    try {
      const { data: rows, error } = await client.rpc('community_locations');
      if (error) throw error;
      data = (rows ?? []) as LocationRow[];
    } catch (err) {
      console.error('[community-map] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (auth.initialized) void load();
  });
  $effect(() => {
    if (auth.initialized) void load();
  });

  // Karten-Koordinaten (Lat/Lng) — approximativ.
  // SVG-Viewbox geht von 0..1000 horizontal und 0..700 vertikal,
  // projiziert grob Mitteleuropa.
  // ProjectionCenter: ~50°N, 10°O ≈ center der Karte.
  // Lat: 60°N (Skandinavien) → y≈0, 45°N (Italien) → y≈700.
  // Lng: -2° (UK West) → x≈0, 25° (Polen Ost) → x≈1000.
  function project(lat: number, lng: number): { x: number; y: number } {
    const minLng = -2,
      maxLng = 25;
    const minLat = 45,
      maxLat = 60;
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 700;
    return { x, y };
  }

  // DE-Regionen (erste PLZ-Ziffer) → approximate Region-Center
  const deRegions: Record<string, { lat: number; lng: number; label: string }> = {
    '0': { lat: 51.1, lng: 13.7, label: 'Sachsen / Ostdt.' }, // Dresden
    '1': { lat: 52.5, lng: 13.4, label: 'Berlin / Brandenb.' }, // Berlin
    '2': { lat: 53.5, lng: 10.0, label: 'Hamburg / SH / Nds.' }, // Hamburg
    '3': { lat: 52.4, lng: 9.7, label: 'Niedersachsen / Hess.' }, // Hannover
    '4': { lat: 51.5, lng: 7.5, label: 'NRW Ruhr' }, // Dortmund
    '5': { lat: 50.9, lng: 6.9, label: 'NRW Süd / Köln' }, // Köln
    '6': { lat: 50.1, lng: 8.7, label: 'Hessen / RLP' }, // Frankfurt
    '7': { lat: 48.8, lng: 9.2, label: 'BW' }, // Stuttgart
    '8': { lat: 48.1, lng: 11.6, label: 'Bayern Süd' }, // München
    '9': { lat: 49.5, lng: 11.1, label: 'Bayern Nord / Mitte' }, // Nürnberg
  };

  // Andere Länder → Hauptstadt-Approximationen
  const countryCenters: Record<string, { lat: number; lng: number; label: string }> = {
    AT: { lat: 48.2, lng: 16.4, label: 'Österreich' },
    CH: { lat: 47.0, lng: 8.3, label: 'Schweiz' },
    NL: { lat: 52.4, lng: 4.9, label: 'Niederlande' },
    BE: { lat: 50.8, lng: 4.4, label: 'Belgien' },
    LU: { lat: 49.6, lng: 6.1, label: 'Luxemburg' },
    DK: { lat: 55.7, lng: 12.6, label: 'Dänemark' },
    PL: { lat: 52.2, lng: 21.0, label: 'Polen' },
    CZ: { lat: 50.1, lng: 14.4, label: 'Tschechien' },
    FR: { lat: 48.9, lng: 2.4, label: 'Frankreich' },
    IT: { lat: 45.5, lng: 9.2, label: 'Italien' },
    GB: { lat: 51.5, lng: -0.1, label: 'UK' },
    SE: { lat: 59.3, lng: 18.1, label: 'Schweden' },
    NO: { lat: 59.9, lng: 10.8, label: 'Norwegen' },
  };

  interface MapDot {
    x: number;
    y: number;
    count: number;
    label: string;
    isHome: boolean;
  }

  const dots = $derived.by<MapDot[]>(() => {
    const result: MapDot[] = [];
    for (const row of data) {
      if (row.country === 'DE' && row.region !== '_' && deRegions[row.region]) {
        const r = deRegions[row.region];
        const { x, y } = project(r.lat, r.lng);
        result.push({ x, y, count: row.count, label: r.label, isHome: true });
      } else if (row.country === 'DE') {
        // Fallback: zentrum Deutschland für DE-Profile ohne PLZ
        const { x, y } = project(51.0, 10.5);
        result.push({ x, y, count: row.count, label: 'Deutschland', isHome: true });
      } else if (countryCenters[row.country]) {
        const c = countryCenters[row.country];
        const { x, y } = project(c.lat, c.lng);
        result.push({ x, y, count: row.count, label: c.label, isHome: false });
      }
    }
    return result;
  });

  const totalUsers = $derived(data.reduce((sum, r) => sum + r.count, 0));

  function radius(count: number): number {
    // Logarithmische Skala — sonst dominieren grosse Counts alles
    return 6 + Math.sqrt(count) * 4;
  }

  // Energize-Standort (Stockelsdorf, SH ≈ 53.9°N, 10.7°O)
  const festival = project(53.9, 10.7);
</script>

<div class="border-2 border-border bg-surface">
  {#if loading}
    <div class="aspect-[10/7] flex items-center justify-center bg-surface">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Lade Karte …
      </p>
    </div>
  {:else if errorMsg}
    <div class="aspect-[10/7] flex items-center justify-center bg-surface p-6 text-center">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Karte derzeit nicht verfügbar
      </p>
    </div>
  {:else if dots.length === 0}
    <div class="aspect-[10/7] flex items-center justify-center bg-surface p-6 text-center">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Noch keine Community-Standorte zu zeigen.
      </p>
    </div>
  {:else}
    <svg
      viewBox="0 0 1000 700"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Karte: Community-Standorte"
      class="block aspect-[10/7] w-full"
    >
      <!-- Hintergrund-Grid (subtle) -->
      <defs>
        <pattern id="cm-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            stroke-width="1"
          />
        </pattern>
        <filter id="dot-glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="1000" height="700" fill="#0a0a0a" />
      <rect width="1000" height="700" fill="url(#cm-grid)" />

      <!-- Geo-Labels (orientierende Punkte ohne echte Geometrie) -->
      {#each Object.entries(countryCenters) as [code, c] (code)}
        {@const p = project(c.lat, c.lng)}
        <text
          x={p.x}
          y={p.y - 4}
          fill="rgba(255,255,255,0.15)"
          font-family="JetBrains Mono"
          font-size="10"
          text-anchor="middle"
          letter-spacing="2"
        >
          {code}
        </text>
      {/each}
      <text
        x={project(51, 10.5).x}
        y={project(51, 10.5).y - 4}
        fill="rgba(255,255,255,0.15)"
        font-family="JetBrains Mono"
        font-size="10"
        text-anchor="middle"
        letter-spacing="2"
      >
        DE
      </text>

      <!-- Festival-Marker -->
      <g>
        <circle cx={festival.x} cy={festival.y} r="22" fill="#FFEC00" opacity="0.15" />
        <circle cx={festival.x} cy={festival.y} r="10" fill="#FFEC00" />
        <circle cx={festival.x} cy={festival.y} r="3" fill="#0A0A0A" />
        <text
          x={festival.x}
          y={festival.y + 28}
          fill="#FFEC00"
          font-family="Barlow Condensed"
          font-weight="900"
          font-size="14"
          text-anchor="middle"
          letter-spacing="3"
        >
          ENERGIZE
        </text>
      </g>

      <!-- Community-Dots (anonym, aggregiert) -->
      {#each dots as dot, i (i)}
        <g>
          <circle
            cx={dot.x}
            cy={dot.y}
            r={radius(dot.count) + 4}
            fill={dot.isHome ? '#FFEC00' : '#9a9a9a'}
            opacity="0.12"
            filter="url(#dot-glow)"
          />
          <circle
            cx={dot.x}
            cy={dot.y}
            r={radius(dot.count)}
            fill={dot.isHome ? '#FFEC00' : '#9a9a9a'}
            opacity="0.85"
          />
          <text
            x={dot.x}
            y={dot.y + 5}
            fill={dot.isHome ? '#0A0A0A' : '#0A0A0A'}
            font-family="Barlow Condensed"
            font-weight="900"
            font-size={Math.max(12, radius(dot.count) * 0.8)}
            text-anchor="middle"
          >
            {dot.count}
          </text>
        </g>
      {/each}
    </svg>

    <!-- Legende -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-t-2 border-border bg-bg p-4"
    >
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        <span class="text-fg">{totalUsers}</span> Energizer · {dots.length} Standorte (anonymisiert)
      </p>
      <div
        class="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        <span class="inline-flex items-center gap-2">
          <span class="inline-block h-3 w-3 rounded-full bg-accent"></span>
          Deutschland
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="inline-block h-3 w-3 rounded-full" style="background:#9a9a9a;"></span>
          Ausland
        </span>
      </div>
    </div>
  {/if}
</div>
