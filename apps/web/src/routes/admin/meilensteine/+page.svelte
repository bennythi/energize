<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { errorMessage } from '$lib/crew-api';

  interface Milestone {
    id: string;
    title: string;
    description: string;
    category: string;
    due_date: string;
    completed_at: string;
  }

  interface Draft {
    id: string;
    title: string;
    description: string;
    category: string;
    due_date: string;
  }

  type Filter = 'open' | 'done' | 'all';

  const SUGGESTED_CATEGORIES = [
    'Bestellung Feuerwerk',
    'Bestellung Funkgeraete',
    'Bestellung Baufahrzeuge',
    'Bestellung Toiletten',
    'Bestellung Buehne',
    'Bestellung Licht',
    'Bestellung Catering',
    'Genehmigung',
    'Vertrag',
    'Lieferung',
    'Marketing',
    'Sonstiges',
  ];

  let milestones = $state<Milestone[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let actingOn = $state<string | null>(null);
  let editing = $state<Draft | null>(null);
  let editorEl = $state<HTMLElement | null>(null);
  let filter = $state<Filter>('open');

  onMount(() => void load());

  function todayIso(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  async function load(showSkeleton = true) {
    if (!auth.pb) return;
    if (showSkeleton) loading = true;
    errorMsg = null;
    try {
      milestones = await auth.pb
        .collection('crew_milestones')
        .getFullList({ sort: 'due_date,title' });
    } catch (err) {
      console.error('[admin/meilensteine] load failed', err);
      errorMsg = errorMessage(err, 'Meilensteine konnten nicht geladen werden.');
    } finally {
      loading = false;
    }
  }

  async function openEditor(draft: Draft) {
    editing = draft;
    formError = null;
    await tick();
    editorEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openNew() {
    void openEditor({
      id: '',
      title: '',
      description: '',
      category: SUGGESTED_CATEGORIES[0],
      due_date: todayIso(),
    });
  }

  function openEdit(m: Milestone) {
    void openEditor({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      due_date: m.due_date.slice(0, 10),
    });
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!auth.pb || !editing) return;
    const data = {
      title: editing.title.trim(),
      description: editing.description.trim(),
      category: editing.category.trim(),
      due_date: editing.due_date,
    };
    if (!data.title || !data.category || !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) {
      formError = 'Titel, Kategorie und Faelligkeitsdatum sind Pflicht.';
      return;
    }
    saving = true;
    formError = null;
    try {
      const col = auth.pb.collection('crew_milestones');
      if (editing.id) await col.update(editing.id, data);
      else await col.create(data);
      editing = null;
      await load(false);
    } catch (err) {
      console.error('[admin/meilensteine] save failed', err);
      formError = errorMessage(err, 'Meilenstein konnte nicht gespeichert werden.');
    } finally {
      saving = false;
    }
  }

  async function setDone(m: Milestone, done: boolean) {
    if (!auth.pb) return;
    actingOn = m.id;
    errorMsg = null;
    try {
      const updated = await auth.pb
        .collection('crew_milestones')
        .update(m.id, { completed_at: done ? new Date().toISOString() : '' });
      milestones = milestones.map((x) => (x.id === m.id ? updated : x));
    } catch (err) {
      console.error('[admin/meilensteine] toggle failed', err);
      errorMsg = errorMessage(err, 'Status konnte nicht geaendert werden.');
    } finally {
      actingOn = null;
    }
  }

  async function remove(m: Milestone) {
    if (!auth.pb) return;
    if (!confirm(`Meilenstein "${m.title}" wirklich loeschen?`)) return;
    actingOn = m.id;
    errorMsg = null;
    try {
      await auth.pb.collection('crew_milestones').delete(m.id);
      milestones = milestones.filter((x) => x.id !== m.id);
      if (editing?.id === m.id) editing = null;
    } catch (err) {
      console.error('[admin/meilensteine] delete failed', err);
      errorMsg = errorMessage(err, 'Meilenstein konnte nicht geloescht werden.');
    } finally {
      actingOn = null;
    }
  }

  const today = todayIso();
  const openCount = $derived(milestones.filter((m) => !m.completed_at).length);
  const visible = $derived(
    milestones.filter((m) =>
      filter === 'all' ? true : filter === 'open' ? !m.completed_at : !!m.completed_at,
    ),
  );

  function fmtDate(isoDate: string): string {
    const [y, mo, d] = isoDate.slice(0, 10).split('-');
    return y && mo && d ? `${d}.${mo}.${y}` : '—';
  }

  function isOverdue(m: Milestone): boolean {
    return !m.completed_at && m.due_date.slice(0, 10) < today;
  }

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Offen' },
    { value: 'done', label: 'Erledigt' },
    { value: 'all', label: 'Alle' },
  ];
</script>

<svelte:head>
  <title>Admin · Meilensteine</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-fg">Meilensteine</h1>
      <p class="mt-3 max-w-2xl text-fg-muted">
        Termine fuer Bestellungen, Genehmigungen und Vertraege. Crew mit Leserecht sieht den
        Jahreskalender und kann erledigte Punkte abhaken.
      </p>
    </div>
    {#if !editing}
      <Button onclick={openNew}>+ Neuer Meilenstein</Button>
    {/if}
  </div>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if editing}
    <form bind:this={editorEl} class="card mt-8 scroll-mt-6 p-6" onsubmit={save}>
      <h2 class="text-lg font-semibold text-fg">
        {editing.id ? 'Meilenstein bearbeiten' : 'Neuer Meilenstein'}
      </h2>
      <label class="mt-5 block">
        <span class="text-sm text-fg-muted">Titel</span>
        <input type="text" bind:value={editing.title} maxlength="200" required class="field mt-1" />
      </label>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm text-fg-muted">Kategorie</span>
          <input
            type="text"
            bind:value={editing.category}
            list="cat-suggestions"
            maxlength="80"
            required
            class="field mt-1"
          />
          <datalist id="cat-suggestions">
            {#each SUGGESTED_CATEGORIES as c (c)}
              <option value={c}></option>
            {/each}
          </datalist>
        </label>
        <label class="block">
          <span class="text-sm text-fg-muted">Faellig am</span>
          <input type="date" bind:value={editing.due_date} required class="field mt-1" />
        </label>
      </div>
      <label class="mt-4 block">
        <span class="text-sm text-fg-muted">Beschreibung (optional)</span>
        <textarea bind:value={editing.description} rows="5" maxlength="4000" class="field mt-1"
        ></textarea>
      </label>
      {#if formError}
        <p class="mt-4 text-sm text-danger">{formError}</p>
      {/if}
      <div class="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>{saving ? 'Speichere …' : 'Speichern'}</Button>
        <Button variant="ghost" onclick={() => (editing = null)} disabled={saving}>
          Abbrechen
        </Button>
      </div>
    </form>
  {/if}

  <div class="segment mt-8" role="group" aria-label="Filter">
    {#each FILTERS as f (f.value)}
      <button
        class="seg"
        class:seg-on={filter === f.value}
        aria-pressed={filter === f.value}
        onclick={() => (filter = f.value)}
      >
        {f.label}{#if f.value === 'open' && !loading}
          <span class="ml-1 tabular-nums opacity-70">{openCount}</span>{/if}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="card mt-4 h-40 animate-pulse opacity-50"></div>
  {:else if visible.length === 0}
    <div class="card mt-4 p-6">
      <p class="text-fg-muted">
        {milestones.length === 0
          ? 'Noch keine Meilensteine angelegt.'
          : filter === 'open'
            ? 'Alles erledigt.'
            : 'Keine Eintraege.'}
      </p>
    </div>
  {:else}
    <ul class="card mt-4 overflow-hidden">
      {#each visible as m (m.id)}
        {@const busy = actingOn === m.id}
        <li class="row flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <p class="font-medium text-fg" class:done={!!m.completed_at}>{m.title}</p>
            <p class="mt-1 text-sm">
              <span
                class="tabular-nums"
                class:text-danger={isOverdue(m)}
                class:text-fg-muted={!isOverdue(m)}
              >
                {fmtDate(m.due_date)}{#if isOverdue(m)}
                  · ueberfaellig{/if}
              </span>
              <span class="text-fg-muted"> · {m.category}</span>
              {#if m.completed_at}
                <span class="text-success"> · erledigt</span>
              {/if}
            </p>
            {#if m.description}
              <p class="mt-2 max-w-2xl whitespace-pre-line text-sm text-fg-muted">
                {m.description}
              </p>
            {/if}
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            {#if m.completed_at}
              <button class="pill" disabled={busy} onclick={() => setDone(m, false)}>
                Wieder oeffnen
              </button>
            {:else}
              <button class="pill pill-success" disabled={busy} onclick={() => setDone(m, true)}>
                Erledigt
              </button>
            {/if}
            <button class="pill" disabled={busy} onclick={() => openEdit(m)}>Bearbeiten</button>
            <button class="pill pill-danger" disabled={busy} onclick={() => remove(m)}>
              Loeschen
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .row + .row {
    border-top: 1px solid var(--glass-border);
  }
  .done {
    text-decoration: line-through;
    color: var(--color-fg-muted);
  }
  .segment {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
  }
  .seg {
    padding: 0.4rem 0.9rem;
    border-radius: var(--radius-pill);
    color: var(--color-fg-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .seg-on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
  .pill {
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg);
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .pill:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pill-success {
    color: var(--color-success);
  }
  @media (hover: hover) and (pointer: fine) {
    .seg:not(.seg-on):hover {
      color: var(--color-fg);
    }
    .pill:not(:disabled):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
    }
    .pill.pill-success:not(:disabled):hover {
      border-color: var(--color-success);
    }
    .pill.pill-danger:not(:disabled):hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
</style>
