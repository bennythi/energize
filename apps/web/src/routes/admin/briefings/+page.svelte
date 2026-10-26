<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { errorMessage } from '$lib/crew-api';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    body: string;
    pinned: boolean;
    updated: string;
  }

  interface Draft {
    id: string;
    department: string;
    title: string;
    body: string;
    pinned: boolean;
  }

  const SUGGESTED_DEPARTMENTS = [
    'Einlass',
    'Security Einlass',
    'TopUp-Kassierer',
    'Gastropersonal',
    'Technik',
    'Supporter',
    'Awareness',
    'Logistik',
  ];

  let briefings = $state<Briefing[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let deletingId = $state<string | null>(null);
  let editing = $state<Draft | null>(null);
  let editorEl = $state<HTMLElement | null>(null);

  onMount(() => void load());

  async function load(showSkeleton = true) {
    if (!auth.pb) return;
    if (showSkeleton) loading = true;
    errorMsg = null;
    try {
      briefings = await auth.pb
        .collection('crew_briefings')
        .getFullList({ sort: '-pinned,department,title' });
    } catch (err) {
      console.error('[admin/briefings] load failed', err);
      errorMsg = errorMessage(err, 'Briefings konnten nicht geladen werden.');
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
      department: SUGGESTED_DEPARTMENTS[0],
      title: '',
      body: '',
      pinned: false,
    });
  }

  function openEdit(b: Briefing) {
    void openEditor({
      id: b.id,
      department: b.department,
      title: b.title,
      body: b.body,
      pinned: b.pinned,
    });
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!auth.pb || !editing) return;
    const data = {
      department: editing.department.trim(),
      title: editing.title.trim(),
      body: editing.body,
      pinned: editing.pinned,
    };
    if (!data.department || !data.title) {
      formError = 'Abteilung und Titel sind Pflicht.';
      return;
    }
    saving = true;
    formError = null;
    try {
      const col = auth.pb.collection('crew_briefings');
      if (editing.id) await col.update(editing.id, data);
      else await col.create(data);
      editing = null;
      await load(false);
    } catch (err) {
      console.error('[admin/briefings] save failed', err);
      formError = errorMessage(err, 'Briefing konnte nicht gespeichert werden.');
    } finally {
      saving = false;
    }
  }

  async function remove(b: Briefing) {
    if (!auth.pb) return;
    if (!confirm(`Briefing "${b.title}" wirklich loeschen?`)) return;
    deletingId = b.id;
    errorMsg = null;
    try {
      await auth.pb.collection('crew_briefings').delete(b.id);
      briefings = briefings.filter((x) => x.id !== b.id);
      if (editing?.id === b.id) editing = null;
    } catch (err) {
      console.error('[admin/briefings] delete failed', err);
      errorMsg = errorMessage(err, 'Briefing konnte nicht geloescht werden.');
    } finally {
      deletingId = null;
    }
  }

  const groups = $derived.by(() => {
    const map = new Map<string, Briefing[]>();
    for (const b of briefings) {
      const list = map.get(b.department) ?? [];
      list.push(b);
      map.set(b.department, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  function fmtDate(iso: string): string {
    const d = new Date(iso.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('de-DE');
  }
</script>

<svelte:head>
  <title>Admin · Briefings</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-fg">Briefings</h1>
      <p class="mt-3 max-w-2xl text-fg-muted">
        Briefing-Dokumente pro Abteilung. Crew mit Leserecht auf Briefings sieht sie im
        Crew-Bereich, Zeilenumbrueche bleiben erhalten.
      </p>
    </div>
    {#if !editing}
      <Button onclick={openNew}>+ Neues Briefing</Button>
    {/if}
  </div>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if editing}
    <form bind:this={editorEl} class="card mt-8 scroll-mt-6 p-6" onsubmit={save}>
      <h2 class="text-lg font-semibold text-fg">
        {editing.id ? 'Briefing bearbeiten' : 'Neues Briefing'}
      </h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm text-fg-muted">Abteilung</span>
          <input
            type="text"
            bind:value={editing.department}
            list="dept-suggestions"
            maxlength="80"
            required
            class="field mt-1"
          />
          <datalist id="dept-suggestions">
            {#each SUGGESTED_DEPARTMENTS as d (d)}
              <option value={d}></option>
            {/each}
          </datalist>
        </label>
        <label class="block">
          <span class="text-sm text-fg-muted">Titel</span>
          <input
            type="text"
            bind:value={editing.title}
            maxlength="200"
            required
            class="field mt-1"
          />
        </label>
      </div>
      <label class="mt-4 block">
        <span class="text-sm text-fg-muted">Inhalt (Text mit Zeilenumbruechen)</span>
        <textarea
          bind:value={editing.body}
          rows="14"
          maxlength="50000"
          class="field mt-1 font-mono text-sm leading-relaxed"
        ></textarea>
      </label>
      <label class="mt-4 flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" bind:checked={editing.pinned} class="accent-[var(--color-accent)]" />
        Anpinnen (erscheint ganz oben in der Crew-Ansicht)
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

  {#if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else if groups.length === 0}
    <div class="card mt-8 p-6">
      <p class="text-fg-muted">Noch keine Briefings angelegt.</p>
    </div>
  {:else}
    {#each groups as [department, list] (department)}
      <section class="mt-10">
        <h2 class="text-sm font-medium uppercase tracking-wider text-accent">{department}</h2>
        <ul class="card mt-3 overflow-hidden">
          {#each list as b (b.id)}
            <li
              class="row flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="min-w-0">
                <p class="font-medium text-fg">
                  {#if b.pinned}<span class="text-accent" title="Angepinnt">★</span>
                  {/if}{b.title}
                </p>
                <p class="mt-0.5 text-xs text-fg-muted">aktualisiert {fmtDate(b.updated)}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <Button variant="ghost" onclick={() => openEdit(b)}>Bearbeiten</Button>
                <button
                  class="del"
                  disabled={deletingId === b.id}
                  onclick={() => remove(b)}
                  aria-label="Briefing {b.title} loeschen"
                >
                  Loeschen
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>

<style>
  .row + .row {
    border-top: 1px solid var(--glass-border);
  }
  .del {
    padding: 0.7rem 1rem;
    border-radius: var(--radius-pill);
    color: var(--color-fg-muted);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--dur-hover) var(--ease-out);
  }
  .del:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .del:not(:disabled):hover {
      color: var(--color-danger);
    }
  }
</style>
