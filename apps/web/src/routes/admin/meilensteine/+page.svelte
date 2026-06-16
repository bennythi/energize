<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface Milestone {
    id: string;
    title: string;
    description: string | null;
    category: string;
    due_date: string;
    completed_at: string | null;
    completed_by: string | null;
  }

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
  let acting = $state(false);

  let editing = $state<Milestone | null>(null);
  let isNew = $state(false);

  $effect(() => {
    if (!auth.loading && auth.adminChecked && !auth.isAdmin) {
      void goto('/account', { replaceState: true });
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
      console.error('[admin/meilensteine] load failed', err);
      errorMsg = 'Konnte Meilensteine nicht laden. Migration 0017 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function openNew() {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    editing = {
      id: '',
      title: '',
      description: '',
      category: SUGGESTED_CATEGORIES[0],
      due_date: iso,
      completed_at: null,
      completed_by: null,
    };
    isNew = true;
  }
  function openEdit(m: Milestone) {
    editing = { ...m };
    isNew = false;
  }
  function closeEdit() {
    editing = null;
  }

  async function save() {
    const client = auth.client;
    if (!client || !editing) return;
    acting = true;
    try {
      const { error } = await client.rpc('admin_crew_milestone_upsert', {
        target_id: isNew ? null : editing.id,
        new_title: editing.title.trim(),
        new_description: (editing.description ?? '').trim() || null,
        new_category: editing.category.trim(),
        new_due_date: editing.due_date,
      });
      if (error) throw error;
      closeEdit();
      await load();
    } catch (err) {
      console.error('[admin/meilensteine] save failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  async function remove(m: Milestone) {
    if (!confirm(`Meilenstein "${m.title}" wirklich loeschen?`)) return;
    const client = auth.client;
    if (!client) return;
    try {
      const { error } = await client.rpc('admin_crew_milestone_delete', { target_id: m.id });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[admin/meilensteine] delete failed', err);
    }
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Admin · Meilensteine · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Admin / Meilensteine
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Meilensteine
    </h1>
    <p class="mt-3 max-w-2xl text-sm text-fg-muted">
      Termin-Vorgaben fuer Bestellungen, Genehmigungen, Vertraege. Crew mit Lese-Recht auf
      <span class="font-mono text-fg">crew.meilensteine</span> sieht den Jahreskalender und kann erledigte
      Punkte abhaken.
    </p>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    <div class="mt-6">
      <Button variant="yellow" onclick={openNew}>+ Neuer Meilenstein</Button>
    </div>

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else if milestones.length === 0}
      <p class="mt-8 text-fg-muted">Noch keine Meilensteine angelegt.</p>
    {:else}
      <ul class="mt-6 divide-y divide-border border-y border-border">
        {#each milestones as m (m.id)}
          <li class="flex items-start justify-between gap-4 p-3">
            <div>
              <p class="font-mono text-sm text-fg">
                {m.title}
                {#if m.completed_at}
                  <span
                    class="ml-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-[var(--color-green,#22C77B)]"
                  >
                    erledigt
                  </span>
                {/if}
              </p>
              <p class="mt-1 font-mono text-xs text-fg-muted">
                {fmtDate(m.due_date)} · {m.category}
              </p>
              {#if m.description}
                <p class="mt-1 text-xs text-fg-muted">{m.description}</p>
              {/if}
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                onclick={() => openEdit(m)}
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
              >
                bearbeiten
              </button>
              <button
                onclick={() => remove(m)}
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)]"
              >
                loeschen
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>

{#if editing}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex max-h-[90vh] w-full max-w-2xl flex-col border-2 border-accent bg-bg">
      <header class="border-b border-border p-4">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          {isNew ? 'Neuer Meilenstein' : 'Meilenstein bearbeiten'}
        </p>
      </header>
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Titel
          </span>
          <input
            type="text"
            bind:value={editing.title}
            maxlength="200"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Kategorie
            </span>
            <input
              type="text"
              bind:value={editing.category}
              list="cat-suggestions"
              class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
            />
            <datalist id="cat-suggestions">
              {#each SUGGESTED_CATEGORIES as c (c)}
                <option value={c}></option>
              {/each}
            </datalist>
          </label>
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Faelligkeitsdatum
            </span>
            <input
              type="date"
              bind:value={editing.due_date}
              class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Beschreibung (optional)
          </span>
          <textarea
            bind:value={editing.description}
            rows="6"
            maxlength="4000"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          ></textarea>
        </label>
      </div>
      <footer class="flex gap-3 border-t border-border p-4">
        <Button
          variant="yellow"
          onclick={save}
          disabled={acting ||
            !editing.title.trim() ||
            !editing.category.trim() ||
            !editing.due_date}
        >
          {acting ? 'Speichere ...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onclick={closeEdit} disabled={acting}>Abbrechen</Button>
      </footer>
    </div>
  </div>
{/if}
