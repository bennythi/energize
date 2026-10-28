<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import { parsePbDate } from '$lib/crew/dates';
  import BackLink from '$lib/crew/BackLink.svelte';
  import NoAccess from '$lib/crew/NoAccess.svelte';
  import { t, lang, locale } from '$lib/i18n';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    pinned: boolean;
    updated: string;
  }

  const canRead = $derived(auth.canRead(CREW_RESOURCES.briefings));

  let briefings = $state<Briefing[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  onMount(() => {
    if (canRead) void load();
    else loading = false;
  });

  async function load() {
    const pb = auth.pb;
    if (!pb) return;
    loading = true;
    errorMsg = null;
    try {
      const rows = await pb.collection('crew_briefings').getFullList({
        fields: 'id,department,title,pinned,updated',
        sort: 'department,-pinned,-updated',
      });
      briefings = rows.map((r) => ({
        id: r.id,
        department: r.department,
        title: r.title,
        pinned: r.pinned === true,
        updated: r.updated,
      }));
    } catch (err) {
      console.error('[crew/briefings] load failed', err);
      errorMsg = errorMessage(
        err,
        t('Konnte die Briefings nicht laden.', 'Could not load the briefings.'),
      );
    } finally {
      loading = false;
    }
  }

  // Nach Abteilung gruppiert, innerhalb: angepinnt zuerst, dann neueste.
  const groups = $derived.by(() => {
    const map = new Map<string, Briefing[]>();
    for (const b of briefings) {
      const key = b.department || t('Allgemein', 'General');
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updated.localeCompare(a.updated),
      );
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, lang));
  });

  function fmtDate(value: string): string {
    return parsePbDate(value).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Briefings · Crew</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <BackLink />
  <h1 class="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">Briefings</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Briefing-Dokumente nach Abteilung. Angepinnte Briefings stehen oben.',
      'Briefing documents by department. Pinned briefings are at the top.',
    )}
  </p>

  {#if !canRead}
    <NoAccess area={t('die Briefings', 'the briefings')} />
  {:else}
    {#if auth.isAdmin}
      <div class="mt-6">
        <Button href="/admin/briefings" variant="ghost"
          >{t('Briefings verwalten', 'Manage briefings')}</Button
        >
      </div>
    {/if}

    {#if errorMsg}
      <p class="card mt-6 p-4 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    {#if loading}
      <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
    {:else if groups.length === 0}
      {#if !errorMsg}
        <div class="card mt-8 p-6">
          <p class="text-fg-muted">{t('Noch keine Briefings hinterlegt.', 'No briefings yet.')}</p>
        </div>
      {/if}
    {:else}
      <div class="mt-8 flex flex-col gap-8">
        {#each groups as [department, list] (department)}
          <section>
            <h2 class="text-xs font-medium uppercase tracking-wider text-accent">{department}</h2>
            <ul class="mt-3 grid gap-3 sm:grid-cols-2">
              {#each list as b (b.id)}
                <li>
                  <a
                    href={`/crew/briefings/${b.id}`}
                    class="card card-press flex h-full flex-col gap-2 p-5"
                  >
                    <span class="flex items-start gap-2 font-medium text-fg">
                      {#if b.pinned}
                        <span
                          class="pin"
                          title={t('Angepinnt', 'Pinned')}
                          aria-label={t('Angepinnt', 'Pinned')}>★</span
                        >
                      {/if}
                      <span class="min-w-0 break-words">{b.title}</span>
                    </span>
                    <span class="mt-auto text-xs text-fg-muted">
                      {t('Aktualisiert', 'Updated')}
                      {fmtDate(b.updated)}
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .pin {
    color: var(--color-accent);
    line-height: 1.5;
  }
</style>
