<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { FESTIVAL_DAY, CREW_WINDOW_START, CREW_WINDOW_END } from '$lib/festival';

  let stats = $state({
    availability: 0,
    equipment: 0,
    members: 0,
  });
  let loadingStats = $state(true);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.isCrew && auth.adminChecked) {
      void goto('/account', { replaceState: true });
    }
  });

  async function loadStats() {
    const client = auth.client;
    if (!client || !auth.user) return;
    const [a, e, m] = await Promise.all([
      client.from('crew_availability').select('id', { count: 'exact', head: true }),
      client.from('crew_equipment_requests').select('id', { count: 'exact', head: true }),
      client.rpc('crew_list_members'),
    ]);
    stats = {
      availability: a.count ?? 0,
      equipment: e.count ?? 0,
      members: m.data?.length ?? 0,
    };
    loadingStats = false;
  }

  onMount(() => {
    void loadStats();
  });

  const fmt = (d: Date) =>
    d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const windowLabel = $derived(`${fmt(CREW_WINDOW_START)} bis ${fmt(CREW_WINDOW_END)}`);

  interface Tile {
    label: string;
    value: number | string | null;
    desc: string;
    href: string;
    accent?: boolean;
  }

  const tiles = $derived<Tile[]>([
    {
      label: 'Kalender',
      value: loadingStats ? '...' : stats.availability,
      desc: 'Wann bist du da. Eintraege quer durch die Crew.',
      href: '/crew/kalender',
      accent: true,
    },
    {
      label: 'Funkgeraete',
      value: loadingStats ? '...' : stats.equipment,
      desc: 'Welches Headset brauchst du an welchem Tag.',
      href: '/crew/fungeraete',
    },
    {
      label: 'Crew',
      value: loadingStats ? '...' : stats.members,
      desc: 'Aktive Mitglieder im Crew-Bereich.',
      href: '/crew',
    },
  ]);
</script>

<svelte:head>
  <title>Crew · ENERGIZE</title>
</svelte:head>

{#if auth.user && auth.isCrew}
  <section class="border-b border-border bg-bg">
    <Container>
      <div class="py-16 md:py-20">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          ⚡ Crew-Bereich
        </p>
        <h1
          class="mt-3 font-display font-black uppercase leading-[0.85] tracking-[-0.02em] text-fg"
          style="font-size: clamp(2.5rem, 8vw, 5rem);"
        >
          Hallo, Crew.
        </h1>
        <p class="mt-4 max-w-2xl text-fg-muted">
          Hier landet alles, was wir intern fuer die Organisation brauchen. Festival-Tag {FESTIVAL_DAY}.
          Aktuelles Crew-Fenster: {windowLabel}.
        </p>
      </div>
    </Container>
  </section>

  <Container>
    <section class="py-12 md:py-16">
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each tiles as tile (tile.label)}
          <li>
            <a
              href={tile.href}
              class="card-press block h-full border-2 p-6 transition-colors hover:bg-surface {tile.accent
                ? 'border-accent'
                : 'border-fg'}"
            >
              <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
                {tile.label}
              </p>
              <p
                class="mt-3 font-display text-4xl font-black tabular-nums leading-none text-fg md:text-5xl"
              >
                {tile.value}
              </p>
              <p class="mt-3 text-sm text-fg-muted">{tile.desc}</p>
            </a>
          </li>
        {/each}
      </ul>

      <div class="mt-8 flex flex-wrap gap-3">
        <Button href="/crew/kalender" variant="yellow">Zum Kalender</Button>
        <Button href="/crew/fungeraete" variant="ghost">Funkgeraete</Button>
        {#if auth.isAdmin}
          <Button href="/admin/crew" variant="ghost">Crew verwalten</Button>
        {/if}
      </div>
    </section>
  </Container>
{:else}
  <Container>
    <section class="py-16 text-fg-muted">...</section>
  </Container>
{/if}
