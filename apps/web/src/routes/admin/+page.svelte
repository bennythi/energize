<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';
  import { adminListCrew, adminListUsers, errorMessage } from '$lib/crew-api';
  import { isModuleEnabled } from '$lib/modules';
  import { t } from '$lib/i18n';
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
      errorMsg = errorMessage(
        failed.reason,
        t('Einige Zahlen konnten nicht geladen werden.', 'Some figures could not be loaded.'),
      );
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
        hint: t('Alle Accounts, Rollen und Loeschung', 'All accounts, roles and deletion'),
        value: usersCount,
        href: '/admin/users',
      },
      {
        label: 'Crew',
        hint: t('Crew-Mitglieder und ihre Rollen', 'Crew members and their roles'),
        value: crewCount,
        href: '/admin/crew',
        module: 'crew-core' as ModuleSlug,
      },
      {
        label: t('Rechte', 'Permissions'),
        hint: t('Berechtigungen pro Rolle und Person', 'Permissions per role and person'),
        href: '/admin/berechtigungen',
        module: 'crew-core' as ModuleSlug,
      },
      {
        label: 'Briefings',
        hint: t('Dokumente pro Abteilung', 'Documents per department'),
        value: briefingsCount,
        href: '/admin/briefings',
        module: 'crew-briefings' as ModuleSlug,
      },
      {
        label: t('Offene Meilensteine', 'Open milestones'),
        hint: t('Deadlines, die noch nicht erledigt sind', 'Deadlines not yet done'),
        value: openMilestonesCount,
        href: '/admin/meilensteine',
        module: 'crew-milestones' as ModuleSlug,
        accent: (openMilestonesCount ?? 0) > 0,
      },
      {
        label: t('Cashless-Kassen', 'Cashless registers'),
        hint: t('Stammdaten der Top-Up-Kassen', 'Master data of the top-up registers'),
        value: registersCount,
        href: '/admin/cashless-kassen',
        module: 'cashless' as ModuleSlug,
      },
    ].filter((x) => !x.module || isModuleEnabled(x.module)),
  );
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <p class="text-xs font-medium uppercase tracking-wider text-accent">Admin</p>
  <h1 class="mt-2 text-3xl font-semibold tracking-tight text-fg">{t('Uebersicht', 'Overview')}</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Verwaltung von Usern, Crew, Rechten und den Crew-Inhalten.',
      'Manage users, crew, permissions and crew content.',
    )}
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
          <span class="mt-auto pt-5 text-sm font-medium text-accent">{t('Oeffnen', 'Open')} →</span>
        </a>
      </li>
    {/each}
  </ul>
</div>
