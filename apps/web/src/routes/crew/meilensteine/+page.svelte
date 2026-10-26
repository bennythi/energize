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
      errorMsg = errorMessage(err, 'Konnte die Meilensteine nicht laden.');
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
      errorMsg = errorMessage(err, 'Konnte den Status nicht aendern.');
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
    return parseDay(`${key}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }
  function fmtDate(iso: string): string {
    return parseDay(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
  function fmtDoneAt(value: string): string {
    return parsePbDate(value).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  function dueLabel(days: number): string {
    if (days < -1) return `${-days} Tage ueberfaellig`;
    if (days === -1) return 'seit gestern ueberfaellig';
    if (days === 0) return 'heute faellig';
    if (days === 1) return 'morgen faellig';
    return `in ${days} Tagen`;
  }
</script>

<svelte:head>
  <title>Meilensteine · Crew</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <BackLink />
  <h1 class="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">Meilensteine</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    Bestellungen, Genehmigungen, Vertraege: alle Jahres-Deadlines auf einen Blick.{canWrite
      ? ' Haken setzen, sobald etwas erledigt ist.'
      : ''}
  </p>

  {#if !canRead}
    <NoAccess area="die Meilensteine" />
  {:else}
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <Segmented
        label="Filter"
        options={[
          { value: 'open', label: `Offen (${counts.open})` },
          { value: 'done', label: `Erledigt (${counts.done})` },
          { value: 'all', label: 'Alle' },
        ]}
        bind:value={filter}
      />
      {#if auth.isAdmin}
        <Button href="/admin/meilensteine" variant="ghost">Verwalten</Button>
      {/if}
    </div>

    {#if !loading && counts.overdue > 0 && filter !== 'done'}
      <p class="mt-4 text-sm font-medium text-danger">
        {counts.overdue}
        {counts.overdue === 1 ? 'Meilenstein ist' : 'Meilensteine sind'} ueberfaellig.
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
            ? 'Nichts mehr offen.'
            : filter === 'done'
              ? 'Noch nichts erledigt.'
              : 'Noch keine Meilensteine.'}
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
                        ? `${m.title} wieder oeffnen`
                        : `${m.title} als erledigt markieren`}
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
                          Erledigt am {fmtDoneAt(m.completed_at)}{m.completed_by
                            ? ` von ${memberName(members.get(m.completed_by))}`
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
