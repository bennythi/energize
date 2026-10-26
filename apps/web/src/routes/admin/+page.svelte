<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';
  import { adminListCrew, adminListUsers, errorMessage } from '$lib/crew-api';
  import { isModuleEnabled } from '$lib/modules';
  import type { ModuleSlug } from '@platform/modules';

  let usersCount = $state<number | null>(null);
  let crewCount = $state<number | null>(null);
  let briefingsCount = $state<number | null>(null);
  let openMilestonesCount = $state<number | null>(null);
  let registersCount = $state<number | null>(null);
  let errorMsg = $state<string | null>(null);

  onMount(() => void load());

  async function load() {
    const pb = auth.pb;
    if (!pb) return;
    errorMsg = null;
    const results = await Promise.allSettled([
      adminListUsers().then((r) => (usersCount = r.length)),
      adminListCrew().then((r) => (crewCount = r.length)),
      isModuleEnabled('crew-briefings')
        ? pb
            .collection('crew_briefings')
            .getList(1, 1)
            .then((r) => (briefingsCount = r.totalItems))
        : Promise.resolve(),
      isModuleEnabled('crew-milestones')
        ? pb
            .collection('crew_milestones')
            .getList(1, 1, { filter: 'completed_at = ""' })
            .then((r) => (openMilestonesCount = r.totalItems))
        : Promise.resolve(),
      isModuleEnabled('cashless')
        ? pb
            .collection('cashless_registers')
            .getList(1, 1)
            .then((r) => (registersCount = r.totalItems))
        : Promise.resolve(),
    ]);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed && failed.status === 'rejected') {
      console.error('[admin] stats failed', failed.reason);
      errorMsg = errorMessage(failed.reason, 'Einige Zahlen konnten nicht geladen werden.');
    }
  }

  interface Tile {
    label: string;
    hint: string;
    /** undefined = Kachel ohne Zahl, null = laedt noch */
    value?: number | null;
    href: string;
    module?: ModuleSlug;
    accent?: boolean;
  }

  const tiles = $derived<Tile[]>(
    [
      {
        label: 'User',
        hint: 'Alle Accounts, Rollen und Loeschung',
        value: usersCount,
        href: '/admin/users',
      },
      {
        label: 'Crew',
        hint: 'Crew-Mitglieder und ihre Rollen',
        value: crewCount,
        href: '/admin/crew',
        module: 'crew-core' as ModuleSlug,
      },
      {
        label: 'Rechte',
        hint: 'Berechtigungen pro Rolle und Person',
        href: '/admin/berechtigungen',
        module: 'crew-core' as ModuleSlug,
      },
      {
        label: 'Briefings',
        hint: 'Dokumente pro Abteilung',
        value: briefingsCount,
        href: '/admin/briefings',
        module: 'crew-briefings' as ModuleSlug,
      },
      {
        label: 'Offene Meilensteine',
        hint: 'Deadlines, die noch nicht erledigt sind',
        value: openMilestonesCount,
        href: '/admin/meilensteine',
        module: 'crew-milestones' as ModuleSlug,
        accent: (openMilestonesCount ?? 0) > 0,
      },
      {
        label: 'Cashless-Kassen',
        hint: 'Stammdaten der Top-Up-Kassen',
        value: registersCount,
        href: '/admin/cashless-kassen',
        module: 'cashless' as ModuleSlug,
      },
    ].filter((t) => !t.module || isModuleEnabled(t.module)),
  );
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <p class="text-xs font-medium uppercase tracking-wider text-accent">Admin</p>
  <h1 class="mt-2 text-3xl font-semibold tracking-tight text-fg">Uebersicht</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    Verwaltung von Usern, Crew, Rechten und den Crew-Inhalten.
  </p>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  <ul class="stagger-list mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each tiles as tile (tile.href)}
      <li>
        <a href={tile.href} class="card card-press flex h-full flex-col p-6">
          <span class="text-sm font-medium text-fg-muted">{tile.label}</span>
          {#if tile.value !== undefined}
            <span
              class="mt-3 text-4xl font-semibold tabular-nums tracking-tight"
              class:text-accent={tile.accent}
              class:text-fg={!tile.accent}
            >
              {tile.value ?? '…'}
            </span>
          {/if}
          <span class="mt-3 text-sm text-fg-muted">{tile.hint}</span>
          <span class="mt-auto pt-5 text-sm font-medium text-accent">Oeffnen →</span>
        </a>
      </li>
    {/each}
  </ul>
</div>
