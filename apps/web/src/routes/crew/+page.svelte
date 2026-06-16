<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { FESTIVAL_DAY, CREW_WINDOW_START, CREW_WINDOW_END } from '$lib/festival';
  import { CREW_RESOURCES, CREW_RESOURCE_LABELS, type CrewResource } from '$lib/crewResources';

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

  const fmt = (d: Date) =>
    d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const windowLabel = $derived(`${fmt(CREW_WINDOW_START)} bis ${fmt(CREW_WINDOW_END)}`);

  interface Tile {
    resource: CrewResource;
    href: string;
    accent?: boolean;
  }

  const allTiles: Tile[] = [
    { resource: CREW_RESOURCES.kalender, href: '/crew/kalender', accent: true },
    { resource: CREW_RESOURCES.fungeraete, href: '/crew/fungeraete' },
    { resource: CREW_RESOURCES.kasse, href: '/crew/kasse' },
    { resource: CREW_RESOURCES.briefings, href: '/crew/briefings' },
    { resource: CREW_RESOURCES.meilensteine, href: '/crew/meilensteine' },
  ];

  const visibleTiles = $derived(allTiles.filter((t) => auth.canRead(t.resource)));

  const hasAnyAccess = $derived(visibleTiles.length > 0);
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
      {#if hasAnyAccess}
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each visibleTiles as tile (tile.resource)}
            {@const meta = CREW_RESOURCE_LABELS[tile.resource]}
            <li>
              <a
                href={tile.href}
                class="card-press block h-full border-2 p-6 transition-colors hover:bg-surface {tile.accent
                  ? 'border-accent'
                  : 'border-fg'}"
              >
                <p
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {meta.label}
                </p>
                <p
                  class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
                >
                  Offen
                </p>
                <p class="mt-3 text-sm text-fg-muted">{meta.description}</p>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="border-2 border-fg-muted bg-surface p-6">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Noch keine Berechtigungen
          </p>
          <p class="mt-2 text-fg">
            Du bist als Crew markiert, aber dir wurde noch keine Rolle mit Zugriff auf die einzelnen
            Funktionen zugewiesen. Sag einem Admin Bescheid, der kann dich unter
            <span class="font-mono">/admin/berechtigungen</span> freischalten.
          </p>
        </div>
      {/if}

      {#if auth.isAdmin}
        <div class="mt-8 flex flex-wrap gap-3">
          <Button href="/admin/crew" variant="ghost">Crew verwalten</Button>
          <Button href="/admin/berechtigungen" variant="ghost">Berechtigungen</Button>
        </div>
      {/if}
    </section>
  </Container>
{:else}
  <Container>
    <section class="py-16 text-fg-muted">...</section>
  </Container>
{/if}
