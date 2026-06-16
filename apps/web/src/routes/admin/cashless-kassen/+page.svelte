<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface Register {
    id: string;
    name: string;
    location: string | null;
    is_active: boolean;
  }

  let registers = $state<Register[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state(false);

  let editing = $state<Register | null>(null);
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
        .from('cashless_registers')
        .select('id, name, location, is_active')
        .order('name');
      if (error) throw error;
      registers = (data ?? []) as Register[];
    } catch (err) {
      console.error('[admin/cashless-kassen] load failed', err);
      errorMsg = 'Konnte Kassen nicht laden. Migration 0015 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function openNew() {
    editing = { id: '', name: '', location: '', is_active: true };
    isNew = true;
  }
  function openEdit(r: Register) {
    editing = { ...r };
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
      const { error } = await client.rpc('admin_cashless_register_upsert', {
        target_id: isNew ? null : editing.id,
        new_name: editing.name.trim(),
        new_location: (editing.location ?? '').trim() || null,
        new_active: editing.is_active,
      });
      if (error) throw error;
      closeEdit();
      await load();
    } catch (err) {
      console.error('[admin/cashless-kassen] save failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Admin · Cashless-Kassen · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Admin / Cashless-Kassen
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Kassen-Stammdaten
    </h1>
    <p class="mt-3 max-w-2xl text-sm text-fg-muted">
      Stammdaten der Top-Up-Kassen. Schichten werden im Crew-Bereich geführt (<a
        href="/crew/kasse"
        class="text-accent hover:underline">/crew/kasse</a
      >). Inaktive Kassen tauchen dort nicht mehr auf.
    </p>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    <div class="mt-6">
      <Button variant="yellow" onclick={openNew}>+ Neue Kasse</Button>
    </div>

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else if registers.length === 0}
      <p class="mt-8 text-fg-muted">Noch keine Kassen angelegt.</p>
    {:else}
      <ul class="mt-6 divide-y divide-border border-y border-border">
        {#each registers as r (r.id)}
          <li class="flex items-start justify-between gap-4 p-3">
            <div>
              <p class="font-mono text-sm text-fg">
                {r.name}
                {#if !r.is_active}
                  <span
                    class="ml-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    inaktiv
                  </span>
                {/if}
              </p>
              {#if r.location}
                <p class="font-mono text-xs text-fg-muted">{r.location}</p>
              {/if}
            </div>
            <button
              onclick={() => openEdit(r)}
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
            >
              bearbeiten
            </button>
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
    <div class="w-full max-w-md border-2 border-accent bg-bg p-6">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        {isNew ? 'Neue Kasse' : 'Kasse bearbeiten'}
      </p>
      <div class="mt-4 space-y-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Name
          </span>
          <input
            type="text"
            bind:value={editing.name}
            maxlength="80"
            placeholder="z.B. Kasse Eingang"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Standort (optional)
          </span>
          <input
            type="text"
            bind:value={editing.location}
            maxlength="120"
            placeholder="z.B. Haupteingang, Stage Right"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
        <label class="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" bind:checked={editing.is_active} />
          <span>Aktiv</span>
        </label>
      </div>
      <div class="mt-6 flex gap-3">
        <Button variant="yellow" onclick={save} disabled={acting || !editing.name.trim()}>
          {acting ? 'Speichere ...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onclick={closeEdit} disabled={acting}>Abbrechen</Button>
      </div>
    </div>
  </div>
{/if}
