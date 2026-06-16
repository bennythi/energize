<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    body: string;
    pinned: boolean;
    updated_at: string;
    updated_by: string | null;
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
  let acting = $state(false);

  let editing = $state<Briefing | null>(null);
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
        .from('crew_briefings')
        .select('id, department, title, body, pinned, updated_at, updated_by')
        .order('department')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      briefings = (data ?? []) as Briefing[];
    } catch (err) {
      console.error('[admin/briefings] load failed', err);
      errorMsg = 'Konnte Briefings nicht laden. Migration 0016 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function openNew() {
    editing = {
      id: '',
      department: SUGGESTED_DEPARTMENTS[0],
      title: '',
      body: '',
      pinned: false,
      updated_at: '',
      updated_by: null,
    };
    isNew = true;
  }
  function openEdit(b: Briefing) {
    editing = { ...b };
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
      const { error } = await client.rpc('admin_crew_briefing_upsert', {
        target_id: isNew ? null : editing.id,
        new_department: editing.department.trim(),
        new_title: editing.title.trim(),
        new_body: editing.body,
        new_pinned: editing.pinned,
      });
      if (error) throw error;
      closeEdit();
      await load();
    } catch (err) {
      console.error('[admin/briefings] save failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  async function remove(b: Briefing) {
    if (!confirm(`Briefing "${b.title}" wirklich loeschen?`)) return;
    const client = auth.client;
    if (!client) return;
    try {
      const { error } = await client.rpc('admin_crew_briefing_delete', { target_id: b.id });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[admin/briefings] delete failed', err);
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

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Admin · Briefings · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Admin / Briefings
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Briefings
    </h1>
    <p class="mt-3 max-w-2xl text-sm text-fg-muted">
      Briefing-Dokumente pro Abteilung. Crew mit Lese-Recht auf
      <span class="font-mono text-fg">crew.briefings</span> sieht sie. Markdown-aehnlicher Text wird in
      der Crew-Ansicht mit Zeilenumbruechen gerendert.
    </p>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    <div class="mt-6">
      <Button variant="yellow" onclick={openNew}>+ Neues Briefing</Button>
    </div>

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else if groups.length === 0}
      <p class="mt-8 text-fg-muted">Noch keine Briefings angelegt.</p>
    {:else}
      {#each groups as [department, list] (department)}
        <section class="mt-10">
          <h2
            class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
          >
            {department}
          </h2>
          <ul class="mt-3 divide-y divide-border border-y border-border">
            {#each list as b (b.id)}
              <li class="flex items-start justify-between gap-4 p-3">
                <div>
                  <p class="font-mono text-sm text-fg">
                    {#if b.pinned}<span class="text-accent">★</span>
                    {/if}{b.title}
                  </p>
                  <p
                    class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    aktualisiert {new Date(b.updated_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button
                    onclick={() => openEdit(b)}
                    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
                  >
                    bearbeiten
                  </button>
                  <button
                    onclick={() => remove(b)}
                    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)]"
                  >
                    loeschen
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  </section>
</Container>

{#if editing}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-accent bg-bg">
      <header class="border-b border-border p-4">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          {isNew ? 'Neues Briefing' : 'Briefing bearbeiten'}
        </p>
      </header>
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Abteilung
          </span>
          <input
            type="text"
            bind:value={editing.department}
            list="dept-suggestions"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
          <datalist id="dept-suggestions">
            {#each SUGGESTED_DEPARTMENTS as d (d)}
              <option value={d}></option>
            {/each}
          </datalist>
        </label>
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
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Inhalt (Plain-Text mit Zeilenumbruechen, max. 50.000 Zeichen)
          </span>
          <textarea
            bind:value={editing.body}
            rows="14"
            maxlength="50000"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          ></textarea>
        </label>
        <label class="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" bind:checked={editing.pinned} />
          <span>Anpinnen (erscheint ganz oben in der Crew-Ansicht)</span>
        </label>
      </div>
      <footer class="flex gap-3 border-t border-border p-4">
        <Button
          variant="yellow"
          onclick={save}
          disabled={acting || !editing.title.trim() || !editing.department.trim()}
        >
          {acting ? 'Speichere ...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onclick={closeEdit} disabled={acting}>Abbrechen</Button>
      </footer>
    </div>
  </div>
{/if}
