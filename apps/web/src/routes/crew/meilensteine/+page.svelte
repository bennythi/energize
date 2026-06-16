<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';

  interface Milestone {
    id: string;
    title: string;
    description: string | null;
    category: string;
    due_date: string;
    completed_at: string | null;
    completed_by: string | null;
  }

  let milestones = $state<Milestone[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state<string | null>(null);
  let filter = $state<'all' | 'open' | 'done'>('open');

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.canRead(CREW_RESOURCES.meilensteine) && auth.adminChecked) {
      void goto('/crew', { replaceState: true });
    }
  });

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const { data, error } = await client
        .from('crew_milestones')
        .select('id, title, description, category, due_date, completed_at, completed_by')
        .order('due_date');
      if (error) throw error;
      milestones = (data ?? []) as Milestone[];
    } catch (err) {
      console.error('[crew/meilensteine] load failed', err);
      errorMsg = 'Konnte Meilensteine nicht laden.';
    } finally {
      loading = false;
    }
  }

  async function toggle(m: Milestone) {
    if (!auth.canWrite(CREW_RESOURCES.meilensteine)) return;
    const client = auth.client;
    if (!client) return;
    acting = m.id;
    try {
      const { error } = await client.rpc('crew_milestone_set_completed', {
        target_id: m.id,
        completed: m.completed_at === null,
      });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[crew/meilensteine] toggle failed', err);
    } finally {
      acting = null;
    }
  }

  const filtered = $derived.by(() => {
    if (filter === 'open') return milestones.filter((m) => m.completed_at === null);
    if (filter === 'done') return milestones.filter((m) => m.completed_at !== null);
    return milestones;
  });

  const monthBuckets = $derived.by(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of filtered) {
      const d = new Date(m.due_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  function fmtMonth(key: string): string {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    });
  }
  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
  function daysFromToday(iso: string): number {
    const due = new Date(iso).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    return Math.round((due - today) / (24 * 60 * 60 * 1000));
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Crew · Meilensteine · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-12 md:py-16">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Meilensteine
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        Jahres-Deadlines.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-fg-muted">
        Bestellungen, Genehmigungen, Vertraege. Klick auf einen Punkt schaltet ihn auf erledigt,
        wenn du Bearbeiten-Recht hast.
      </p>
    </div>
  </Container>
</section>

<Container>
  <section class="py-10 md:py-12">
    {#if errorMsg}
      <p class="mb-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    <div class="mb-6 flex flex-wrap gap-2">
      <Button variant={filter === 'open' ? 'yellow' : 'ghost'} onclick={() => (filter = 'open')}>
        Offen
      </Button>
      <Button variant={filter === 'done' ? 'yellow' : 'ghost'} onclick={() => (filter = 'done')}>
        Erledigt
      </Button>
      <Button variant={filter === 'all' ? 'yellow' : 'ghost'} onclick={() => (filter = 'all')}>
        Alle
      </Button>
      {#if auth.isAdmin}
        <Button href="/admin/meilensteine" variant="ghost">+ Verwalten</Button>
      {/if}
    </div>

    {#if loading}
      <p class="text-fg-muted">Lade ...</p>
    {:else if monthBuckets.length === 0}
      <p class="text-fg-muted">
        {filter === 'open'
          ? 'Nichts mehr offen.'
          : filter === 'done'
            ? 'Noch nichts erledigt.'
            : 'Noch keine Meilensteine.'}
      </p>
    {:else}
      {#each monthBuckets as [key, list] (key)}
        <section class="mt-6 first:mt-0">
          <h2
            class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
          >
            {fmtMonth(key)}
          </h2>
          <ul class="mt-2 divide-y divide-border border-y border-border">
            {#each list as m (m.id)}
              {@const days = daysFromToday(m.due_date)}
              {@const overdue = m.completed_at === null && days < 0}
              {@const soon = m.completed_at === null && days >= 0 && days < 14}
              <li
                class="grid grid-cols-[64px_1fr_auto] gap-3 p-3"
                class:bg-surface={m.completed_at}
              >
                <div>
                  <p
                    class="font-display text-2xl font-black tabular-nums leading-none text-fg"
                    class:text-[var(--color-red,#E24B4A)]={overdue}
                    class:text-accent={soon}
                    class:text-fg-muted={m.completed_at}
                  >
                    {fmtDate(m.due_date)}
                  </p>
                  <p
                    class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {overdue ? `${-days} Tg zu spaet` : `in ${days} Tg`}
                  </p>
                </div>
                <div>
                  <p
                    class="font-mono text-sm"
                    class:line-through={m.completed_at}
                    class:text-fg={!m.completed_at}
                    class:text-fg-muted={m.completed_at}
                  >
                    {m.title}
                  </p>
                  <p
                    class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {m.category}
                  </p>
                  {#if m.description}
                    <p class="mt-1 whitespace-pre-line text-xs text-fg-muted">{m.description}</p>
                  {/if}
                </div>
                <div class="self-center">
                  {#if auth.canWrite(CREW_RESOURCES.meilensteine)}
                    <button
                      onclick={() => toggle(m)}
                      disabled={acting === m.id}
                      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline disabled:opacity-50"
                    >
                      {acting === m.id ? '...' : m.completed_at ? 'wieder offen' : 'erledigt'}
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  </section>
</Container>
