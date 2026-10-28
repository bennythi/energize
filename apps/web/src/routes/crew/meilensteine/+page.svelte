<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { listCrewMembers, memberName, errorMessage, type CrewMember } from '$lib/crew-api';
  import { parseDay, parsePbDate, daysFromToday } from '$lib/crew/dates';
  import BackLink from '$lib/crew/BackLink.svelte';
  import NoAccess from '$lib/crew/NoAccess.svelte';
  import Segmented from '$lib/crew/Segmented.svelte';
  import { t, locale } from '$lib/i18n';

  type Filter = 'open' | 'done' | 'all';

  interface Milestone {
    id: string;
    title: string;
    description: string;
    category: string;
    due_date: string;
    completed_at: string;
    completed_by: string;
  }

  const RES = CREW_RESOURCES.meilensteine;
  const canRead = $derived(auth.canRead(RES));
  const canWrite = $derived(auth.canWrite(RES));

  let milestones = $state<Milestone[]>([]);
  let members = $state<Map<string, CrewMember>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state<string | null>(null);
  let filter = $state<Filter>('open');

  onMount(() => {
    if (canRead) void load();
    else loading = false;
  });

  function toMilestone(r: {
    id: string;
    title: string;
    description?: string;
    category: string;
    due_date: string;
    completed_at?: string;
    completed_by?: string;
  }): Milestone {
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      category: r.category,
      due_date: r.due_date,
      completed_at: r.completed_at ?? '',
      completed_by: r.completed_by ?? '',
    };
  }

  async function load() {
    const pb = auth.pb;
    if (!pb) return;
    loading = true;
    errorMsg = null;
    try {
      const [rows, people] = await Promise.all([
        pb.collection('crew_milestones').getFullList({ sort: 'due_date,title' }),
        listCrewMembers().catch(() => [] as CrewMember[]),
      ]);
      milestones = rows.map(toMilestone);
      members = new Map(people.map((m) => [m.id, m]));
    } catch (err) {
      console.error('[crew/meilensteine] load failed', err);
      errorMsg = errorMessage(
        err,
        t('Konnte die Meilensteine nicht laden.', 'Could not load the milestones.'),
      );
    } finally {
      loading = false;
    }
  }

  async function toggle(m: Milestone) {
    const pb = auth.pb;
    if (!pb || !canWrite) return;
    acting = m.id;
    errorMsg = null;
    try {
      // Server setzt beim Erledigen completed_by und den echten Zeitstempel.
      const updated = await pb
        .collection('crew_milestones')
        .update(m.id, { completed_at: m.completed_at ? '' : new Date().toISOString() });
      milestones = milestones.map((x) => (x.id === m.id ? toMilestone(updated) : x));
    } catch (err) {
      console.error('[crew/meilensteine] toggle failed', err);
      errorMsg = errorMessage(
        err,
        t('Konnte den Status nicht aendern.', 'Could not change the status.'),
      );
    } finally {
      acting = null;
    }
  }

  const counts = $derived({
    open: milestones.filter((m) => !m.completed_at).length,
    done: milestones.filter((m) => m.completed_at).length,
    overdue: milestones.filter((m) => !m.completed_at && daysFromToday(m.due_date) < 0).length,
  });

  const filtered = $derived(
    filter === 'open'
      ? milestones.filter((m) => !m.completed_at)
      : filter === 'done'
        ? milestones.filter((m) => m.completed_at)
        : milestones,
  );

  const monthBuckets = $derived.by(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of filtered) {
      const key = m.due_date.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  function fmtMonth(key: string): string {
    return parseDay(`${key}-01`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }
  function fmtDate(iso: string): string {
    return parseDay(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  }
  function fmtDoneAt(value: string): string {
    return parsePbDate(value).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  function dueLabel(days: number): string {
    if (days < -1) return t(`${-days} Tage ueberfaellig`, `${-days} days overdue`);
    if (days === -1) return t('seit gestern ueberfaellig', 'overdue since yesterday');
    if (days === 0) return t('heute faellig', 'due today');
    if (days === 1) return t('morgen faellig', 'due tomorrow');
    return t(`in ${days} Tagen`, `in ${days} days`);
  }
</script>

<svelte:head>
  <title>{t('Meilensteine · Crew', 'Milestones · Crew')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <BackLink />
  <h1 class="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
    {t('Meilensteine', 'Milestones')}
  </h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Bestellungen, Genehmigungen, Vertraege: alle Jahres-Deadlines auf einen Blick.',
      "Orders, permits, contracts: all of the year's deadlines at a glance.",
    )}{canWrite
      ? t(' Haken setzen, sobald etwas erledigt ist.', ' Tick things off as soon as they are done.')
      : ''}
  </p>

  {#if !canRead}
    <NoAccess area={t('die Meilensteine', 'the milestones')} />
  {:else}
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <Segmented
        label={t('Filter', 'Filter')}
        options={[
          { value: 'open', label: t(`Offen (${counts.open})`, `Open (${counts.open})`) },
          { value: 'done', label: t(`Erledigt (${counts.done})`, `Done (${counts.done})`) },
          { value: 'all', label: t('Alle', 'All') },
        ]}
        bind:value={filter}
      />
      {#if auth.isAdmin}
        <Button href="/admin/meilensteine" variant="ghost">{t('Verwalten', 'Manage')}</Button>
      {/if}
    </div>

    {#if !loading && counts.overdue > 0 && filter !== 'done'}
      <p class="mt-4 text-sm font-medium text-danger">
        {counts.overdue === 1
          ? t(
              `${counts.overdue} Meilenstein ist ueberfaellig.`,
              `${counts.overdue} milestone is overdue.`,
            )
          : t(
              `${counts.overdue} Meilensteine sind ueberfaellig.`,
              `${counts.overdue} milestones are overdue.`,
            )}
      </p>
    {/if}

    {#if errorMsg}
      <p class="card mt-6 p-4 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    {#if loading}
      <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
    {:else if monthBuckets.length === 0}
      <div class="card mt-8 p-6">
        <p class="text-fg-muted">
          {filter === 'open'
            ? t('Nichts mehr offen.', 'Nothing left open.')
            : filter === 'done'
              ? t('Noch nichts erledigt.', 'Nothing done yet.')
              : t('Noch keine Meilensteine.', 'No milestones yet.')}
        </p>
      </div>
    {:else}
      <div class="mt-8 flex flex-col gap-8">
        {#each monthBuckets as [key, list] (key)}
          <section>
            <h2 class="text-xs font-medium uppercase tracking-wider text-accent">
              {fmtMonth(key)}
            </h2>
            <ul class="mt-3 flex flex-col gap-3">
              {#each list as m (m.id)}
                {@const done = Boolean(m.completed_at)}
                {@const days = daysFromToday(m.due_date)}
                {@const overdue = !done && days < 0}
                {@const soon = !done && days >= 0 && days < 14}
                <li class="card item p-4 md:p-5" class:done class:overdue>
                  {#if canWrite}
                    <button
                      type="button"
                      class="check"
                      class:on={done}
                      disabled={acting === m.id}
                      aria-pressed={done}
                      aria-label={done
                        ? t(`${m.title} wieder oeffnen`, `Reopen ${m.title}`)
                        : t(`${m.title} als erledigt markieren`, `Mark ${m.title} as done`)}
                      onclick={() => toggle(m)}
                    >
                      {#if acting === m.id}…{:else if done}✓{/if}
                    </button>
                  {:else}
                    <span class="check static" class:on={done} aria-hidden="true">
                      {#if done}✓{/if}
                    </span>
                  {/if}

                  <div class="min-w-0 flex-1">
                    <p
                      class="break-words font-medium"
                      class:text-fg={!done}
                      class:text-fg-muted={done}
                    >
                      <span class:line-through={done}>{m.title}</span>
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {#if m.category}
                        <span class="tag">{m.category}</span>
                      {/if}
                      {#if done}
                        <span class="text-success">
                          {t('Erledigt am', 'Done on')}
                          {fmtDoneAt(m.completed_at)}{m.completed_by
                            ? t(
                                ` von ${memberName(members.get(m.completed_by))}`,
                                ` by ${memberName(members.get(m.completed_by))}`,
                              )
                            : ''}
                        </span>
                      {/if}
                    </div>
                    {#if m.description}
                      <p class="mt-2 whitespace-pre-line break-words text-sm text-fg-muted">
                        {m.description}
                      </p>
                    {/if}
                  </div>

                  <div class="shrink-0 text-right">
                    <p
                      class="text-lg font-semibold tabular-nums leading-none"
                      class:text-danger={overdue}
                      class:text-accent={soon}
                      class:text-fg-muted={done}
                      class:text-fg={!done && !overdue && !soon}
                    >
                      {fmtDate(m.due_date)}
                    </p>
                    {#if !done}
                      <p
                        class="mt-1 text-[11px]"
                        class:text-danger={overdue}
                        class:text-fg-muted={!overdue}
                      >
                        {dueLabel(days)}
                      </p>
                    {/if}
                  </div>
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
  .item {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    border-radius: var(--radius-lg);
  }
  .item.done {
    opacity: 0.7;
  }
  .item.overdue {
    border-color: color-mix(in srgb, var(--color-danger) 45%, transparent);
  }
  .check {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    margin-top: 0.05rem;
    border-radius: var(--radius-pill);
    border: 1.5px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg-inverse);
    font-size: 0.85rem;
    font-weight: 700;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      transform var(--dur-press) var(--ease-spring);
  }
  button.check {
    cursor: pointer;
  }
  button.check:active {
    transform: scale(0.9);
  }
  @media (hover: hover) and (pointer: fine) {
    button.check:hover {
      border-color: var(--color-accent);
    }
  }
  .check.on {
    background-color: var(--color-success);
    border-color: var(--color-success);
  }
  .check:disabled {
    opacity: 0.6;
    color: var(--color-fg);
  }
  .tag {
    padding: 0.1rem 0.5rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    color: var(--color-fg-muted);
  }
  @media (prefers-reduced-motion: reduce) {
    button.check:active {
      transform: none;
    }
  }
</style>
