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

  // Projektion: Lat/Lng → SVG-x/y.
  // Viewbox 1000x700, deckt Mitteleuropa ab.
  // Lng -2 (UK) … 25 (Polen Ost) / Lat 60 (Skandinavien) … 45 (Italien)
  const MIN_LNG = -2,
    MAX_LNG = 25,
    MIN_LAT = 45,
    MAX_LAT = 60;
  function project(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 1000;
    const y = (1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 700;
    return { x, y };
  }

  // Stark vereinfachte Country-Outlines (handgezeichnet, nur Demo-Optik).
  // Bounding-Box-Polygone pro Land.
  function poly(latLng: [number, number][]): string {
    return latLng
      .map((p) => {
        const { x, y } = project(p[0], p[1]);
        return `${x.toFixed(0)},${y.toFixed(0)}`;
      })
      .join(' ');
  }

  // Deutschland — relativ präzises Umriss-Polygon
  const dePath = poly([
    [54.9, 8.3], // Flensburg
    [54.6, 9.3], // SH Ost
    [54.5, 13.4], // Rügen
    [53.4, 14.3], // Stettin
    [52.5, 14.5], // Oder
    [51.0, 14.9], // Görlitz
    [50.2, 12.1], // Cheb
    [49.0, 12.4], // Passau
    [47.6, 12.8], // Berchtesgaden
    [47.4, 9.7], // Bodensee
    [47.5, 7.6], // Basel
    [49.1, 6.4], // Saar
    [50.3, 6.1], // Aachen
    [51.8, 6.7], // NRW
    [53.5, 7.1], // Emden
    [53.7, 8.5], // Wesermündung
    [54.4, 8.7], // Husum
  ]);

  // Nachbarländer — grobe Polygone
  const countryShapes: { code: string; path: string; label: string }[] = [
    {
      code: 'AT',
      label: 'AT',
      path: poly([
        [49.0, 9.5],
        [48.9, 13.0],
        [48.6, 14.0],
        [48.7, 16.9],
        [46.7, 16.5],
        [46.5, 12.4],
        [47.4, 9.7],
      ]),
    },
    {
      code: 'CH',
      label: 'CH',
      path: poly([
        [47.8, 6.0],
        [47.6, 9.7],
        [46.2, 10.4],
        [45.8, 6.8],
        [46.5, 5.9],
      ]),
    },
    {
      code: 'NL',
      label: 'NL',
      path: poly([
        [53.5, 4.5],
        [53.4, 7.0],
        [52.3, 7.0],
        [51.2, 5.5],
        [51.4, 3.4],
        [52.5, 4.0],
      ]),
    },
    {
      code: 'BE',
      label: 'BE',
      path: poly([
        [51.5, 3.0],
        [51.4, 5.7],
        [50.7, 6.0],
        [49.5, 5.7],
        [49.6, 4.0],
        [51.1, 2.6],
      ]),
    },
    {
      code: 'LU',
      label: 'LU',
      path: poly([
        [50.2, 5.7],
        [50.2, 6.4],
        [49.5, 6.5],
        [49.5, 5.7],
      ]),
    },
    {
      code: 'DK',
      label: 'DK',
      path: poly([
        [57.7, 8.0],
        [57.7, 10.5],
        [56.0, 12.7],
        [55.2, 14.5],
        [54.9, 11.5],
        [54.8, 8.4],
      ]),
    },
    {
      code: 'PL',
      label: 'PL',
      path: poly([
        [54.4, 14.2],
        [54.4, 19.5],
        [53.9, 23.5],
        [52.0, 24.0],
        [49.0, 22.5],
        [49.4, 18.8],
        [50.2, 14.9],
        [52.5, 14.5],
      ]),
    },
    {
      code: 'CZ',
      label: 'CZ',
      path: poly([
        [51.0, 12.1],
        [50.9, 15.0],
        [50.0, 18.8],
        [48.7, 18.0],
        [48.6, 14.0],
        [50.2, 12.1],
      ]),
    },
    {
      code: 'FR',
      label: 'FR',
      path: poly([
        [51.0, 2.5],
        [49.5, 5.7],
        [49.2, 8.0],
        [47.5, 7.6],
        [45.0, 6.5],
        [43.4, 4.0],
        [43.4, -1.5],
        [45.5, -1.0],
        [48.5, -4.5],
        [50.2, 1.5],
      ]),
    },
    {
      code: 'IT',
      label: 'IT',
      path: poly([
        [46.5, 7.5],
        [46.5, 13.5],
        [45.6, 13.6],
        [44.0, 12.5],
        [42.5, 14.5],
        [40.0, 18.5],
        [38.0, 16.0],
        [41.0, 13.0],
        [44.0, 8.0],
        [44.5, 7.5],
      ]),
    },
    {
      code: 'GB',
      label: 'UK',
      path: poly([
        [58.5, -5.0],
        [58.5, -2.0],
        [55.5, -1.0],
        [53.0, 0.5],
        [51.0, 1.4],
        [50.5, -1.5],
        [50.0, -5.5],
        [54.0, -4.5],
        [56.5, -5.5],
      ]),
    },
  ];

  // DE-Regionen (erste PLZ-Ziffer) → approximative Zentren
  const deRegions: Record<string, { lat: number; lng: number; label: string }> = {
    '0': { lat: 51.1, lng: 13.7, label: 'Sachsen' },
    '1': { lat: 52.5, lng: 13.4, label: 'Berlin/BB' },
    '2': { lat: 53.5, lng: 10.0, label: 'Hamburg/SH' },
    '3': { lat: 52.4, lng: 9.7, label: 'Nds/Hess.' },
    '4': { lat: 51.5, lng: 7.5, label: 'NRW Nord' },
    '5': { lat: 50.9, lng: 6.9, label: 'NRW Süd' },
    '6': { lat: 50.1, lng: 8.7, label: 'Hess./RLP' },
    '7': { lat: 48.8, lng: 9.2, label: 'BW' },
    '8': { lat: 48.1, lng: 11.6, label: 'Bayern Süd' },
    '9': { lat: 49.5, lng: 11.1, label: 'Bayern N.' },
  };

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

  function dotRadius(count: number): number {
    return 8 + Math.sqrt(count) * 5;
  }

  // ENERGIZE bei Stockelsdorf
  const festival = project(53.9, 10.7);
</script>

<div class="border-2 border-border bg-surface">
  <svg
    viewBox="0 0 1000 700"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Karte Mitteleuropa: Energize Community-Standorte"
    class="block aspect-[10/7] w-full"
  >
    <defs>
      <pattern id="cm-grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      </pattern>
      <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <radialGradient id="festival-pulse">
        <stop offset="0%" stop-color="#FFEC00" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#FFEC00" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Wasser-Hintergrund -->
    <rect width="1000" height="700" fill="#0a0a0a" />
    <rect width="1000" height="700" fill="url(#cm-grid)" />

    <!-- Nachbarländer-Outlines -->
    {#each countryShapes as shape (shape.code)}
      <polygon
        points={shape.path}
        fill="#1f1f1f"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="1"
        stroke-linejoin="round"
      />
    {/each}

    <!-- Deutschland hervorgehoben -->
    <polygon
      points={dePath}
      fill="#2a2a2a"
      stroke="rgba(255,236,0,0.4)"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Country-Codes als subtle Labels -->
    {#each Object.entries(countryCenters) as [code, c] (code)}
      {@const p = project(c.lat, c.lng)}
      <text
        x={p.x}
        y={p.y - 10}
        fill="rgba(255,255,255,0.3)"
        font-family="JetBrains Mono"
        font-size="11"
        text-anchor="middle"
        letter-spacing="2"
        font-weight="700"
      >
        {code}
      </text>
    {/each}
    <text
      x={project(51, 10.5).x}
      y={project(51, 10.5).y - 130}
      fill="rgba(255,236,0,0.6)"
      font-family="Barlow Condensed"
      font-size="22"
      text-anchor="middle"
      letter-spacing="6"
      font-weight="900"
    >
      DEUTSCHLAND
    </text>

    <!-- Festival-Marker bei Stockelsdorf -->
    <g>
      <circle cx={festival.x} cy={festival.y} r="40" fill="url(#festival-pulse)">
        <animate attributeName="r" values="35;48;35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={festival.x} cy={festival.y} r="14" fill="#FFEC00" />
      <circle cx={festival.x} cy={festival.y} r="5" fill="#0A0A0A" />
      <text
        x={festival.x}
        y={festival.y - 24}
        fill="#FFEC00"
        font-family="Barlow Condensed"
        font-weight="900"
        font-size="16"
        text-anchor="middle"
        letter-spacing="3"
      >
        ⚡ ENERGIZE
      </text>
      <text
        x={festival.x}
        y={festival.y + 36}
        fill="#FFEC00"
        font-family="JetBrains Mono"
        font-size="10"
        text-anchor="middle"
        letter-spacing="2"
        opacity="0.7"
      >
        STOCKELSDORF
      </text>
    </g>

    <!-- Community-Dots (über allem) -->
    {#each dots as dot, i (i)}
      <g>
        <circle
          cx={dot.x}
          cy={dot.y}
          r={dotRadius(dot.count) + 8}
          fill={dot.isHome ? '#FFEC00' : '#FFFFFF'}
          opacity="0.18"
          filter="url(#dot-glow)"
        />
        <circle
          cx={dot.x}
          cy={dot.y}
          r={dotRadius(dot.count)}
          fill={dot.isHome ? '#FFEC00' : '#FFFFFF'}
          opacity="0.95"
          stroke="#0a0a0a"
          stroke-width="2"
        />
        <text
          x={dot.x}
          y={dot.y + 5}
          fill="#0A0A0A"
          font-family="Barlow Condensed"
          font-weight="900"
          font-size={Math.max(13, dotRadius(dot.count) * 0.75)}
          text-anchor="middle"
        >
          {dot.count}
        </text>
      </g>
    {/each}
  </svg>

  <!-- Status / Legende -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-t-2 border-border bg-bg p-4">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      {#if loading}
        Lade …
      {:else if errorMsg}
        Daten nicht verfügbar ·
        <span class="text-fg" title={errorMsg}>RPC-Fehler (Migration 0007?)</span>
      {:else if totalUsers === 0}
        Noch keine Standorte · trag deine PLZ im Account ein!
      {:else}
        <span class="text-fg">{totalUsers}</span>
        Energizer · {dots.length} Standorte (anonym)
      {/if}
    </p>
    <div
      class="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
    >
      <span class="inline-flex items-center gap-2">
        <span class="inline-block h-3 w-3 rounded-full bg-accent"></span>
        Deutschland
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="inline-block h-3 w-3 rounded-full bg-white"></span>
        Ausland
      </span>
    </div>
  </div>
</div>
