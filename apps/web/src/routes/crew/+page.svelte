<script lang="ts">
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { isModuleEnabled } from '$lib/modules';
  import { FESTIVAL_DAY, CREW_WINDOW_START, CREW_WINDOW_END } from '$lib/festival';
  import { CREW_RESOURCES, CREW_RESOURCE_LABELS, type CrewResource } from '$lib/crewResources';
  import type { ModuleSlug } from '@platform/modules';
  import { t, locale } from '$lib/i18n';

  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const windowLabel = t(
    `${fmt(CREW_WINDOW_START)} bis ${fmt(CREW_WINDOW_END)}`,
    `${fmt(CREW_WINDOW_START)} to ${fmt(CREW_WINDOW_END)}`,
  );
  const festivalLabel = fmt(new Date(FESTIVAL_DAY));

  interface Tile {
    resource: CrewResource;
    href: string;
    module: ModuleSlug;
  }

  const allTiles: Tile[] = [
    { resource: CREW_RESOURCES.kalender, href: '/crew/kalender', module: 'crew-core' },
    { resource: CREW_RESOURCES.fungeraete, href: '/crew/fungeraete', module: 'crew-core' },
    { resource: CREW_RESOURCES.booking, href: '/crew/booking', module: 'artist-booking' },
    { resource: CREW_RESOURCES.kosten, href: '/crew/kosten', module: 'cost-planning' },
    { resource: CREW_RESOURCES.kasse, href: '/crew/kasse', module: 'cashless' },
    { resource: CREW_RESOURCES.briefings, href: '/crew/briefings', module: 'crew-briefings' },
    {
      resource: CREW_RESOURCES.meilensteine,
      href: '/crew/meilensteine',
      module: 'crew-milestones',
    },
  ];

  const visibleTiles = $derived(
    allTiles.filter((tile) => isModuleEnabled(tile.module) && auth.canRead(tile.resource)),
  );
</script>

<svelte:head>
  <title>Crew</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <p class="text-xs font-medium uppercase tracking-wider text-accent">
    {t('Crew-Bereich', 'Crew area')}
  </p>
  <h1 class="mt-2 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
    {auth.greetingName
      ? t(
          `Hallo ${auth.greetingName}, schoen dass du da bist!`,
          `Hi ${auth.greetingName}, great to have you here!`,
        )
      : t('Hallo, Crew.', 'Hello, crew.')}
  </h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      `Alles, was wir intern fuer die Organisation brauchen. Festival-Tag ${festivalLabel}, Crew-Fenster ${windowLabel}.`,
      `Everything we need internally to run the organisation. Festival day ${festivalLabel}, crew window ${windowLabel}.`,
    )}
  </p>
  {#if auth.profile && !auth.profile.first_name}
    <p class="mt-3 text-sm text-fg-muted">
      {t('Trag unter', 'Add your name and mobile number under')}
      <a href="/account" class="text-accent underline">Account</a>
      {t(
        'deinen Namen und deine Handynummer ein, dann wissen alle, wie sie dich erreichen.',
        'so everyone knows how to reach you.',
      )}
    </p>
  {/if}

  {#if visibleTiles.length > 0}
    <ul class="stagger-list mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each visibleTiles as tile (tile.resource)}
        {@const meta = CREW_RESOURCE_LABELS[tile.resource]}
        <li>
          <a href={tile.href} class="card card-press flex h-full flex-col p-6">
            <span class="text-lg font-semibold text-fg">{meta.label}</span>
            <span class="mt-2 text-sm text-fg-muted">{meta.description}</span>
            <span class="mt-auto pt-5 text-sm font-medium text-accent">
              {auth.canWrite(tile.resource)
                ? t('Oeffnen und bearbeiten', 'Open and edit')
                : t('Ansehen', 'View')} →
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="card mt-10 p-6">
      <p class="font-medium text-fg">{t('Noch keine Berechtigungen', 'No permissions yet')}</p>
      <p class="mt-2 text-sm text-fg-muted">
        {t(
          'Du bist als Crew markiert, hast aber noch keinen Zugriff auf einzelne Bereiche. Ein Admin kann dich unter Admin → Rechte freischalten.',
          "You're marked as crew but don't have access to any areas yet. An admin can grant it under Admin → Permissions.",
        )}
      </p>
    </div>
  {/if}

  {#if auth.isAdmin}
    <div class="mt-10 flex flex-wrap gap-3">
      <Button href="/admin/crew" variant="ghost">{t('Crew verwalten', 'Manage crew')}</Button>
      <Button href="/admin/berechtigungen" variant="ghost"
        >{t('Rechte vergeben', 'Assign permissions')}</Button
      >
    </div>
  {/if}
</div>
