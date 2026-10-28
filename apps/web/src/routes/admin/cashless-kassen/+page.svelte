<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { errorMessage } from '$lib/crew-api';
  import { t } from '$lib/i18n';

  interface Register {
    id: string;
    name: string;
    location: string;
    is_active: boolean;
  }

  let registers = $state<Register[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let actingOn = $state<string | null>(null);
  let editing = $state<Register | null>(null);
  let editorEl = $state<HTMLElement | null>(null);

  onMount(() => void load());

  async function load(showSkeleton = true) {
    if (!auth.pb) return;
    if (showSkeleton) loading = true;
    errorMsg = null;
    try {
      registers = await auth.pb
        .collection('cashless_registers')
        .getFullList({ sort: '-is_active,name' });
    } catch (err) {
      console.error('[admin/cashless-kassen] load failed', err);
      errorMsg = errorMessage(
        err,
        t('Kassen konnten nicht geladen werden.', 'Cash registers could not be loaded.'),
      );
    } finally {
      loading = false;
    }
  }

  async function openEditor(r: Register) {
    editing = r;
    formError = null;
    await tick();
    editorEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!auth.pb || !editing) return;
    const data = {
      name: editing.name.trim(),
      location: editing.location.trim(),
      is_active: editing.is_active,
    };
    if (data.name.length < 2 || data.name.length > 80) {
      formError = t(
        'Der Name muss 2 bis 80 Zeichen lang sein.',
        'The name must be 2 to 80 characters long.',
      );
      return;
    }
    saving = true;
    formError = null;
    try {
      const col = auth.pb.collection('cashless_registers');
      if (editing.id) await col.update(editing.id, data);
      else await col.create(data);
      editing = null;
      await load(false);
    } catch (err) {
      console.error('[admin/cashless-kassen] save failed', err);
      formError = errorMessage(
        err,
        t('Kasse konnte nicht gespeichert werden.', 'Cash register could not be saved.'),
      );
    } finally {
      saving = false;
    }
  }

  async function setActive(r: Register, active: boolean) {
    if (!auth.pb) return;
    actingOn = r.id;
    errorMsg = null;
    try {
      await auth.pb.collection('cashless_registers').update(r.id, { is_active: active });
      registers = registers.map((x) => (x.id === r.id ? { ...x, is_active: active } : x));
    } catch (err) {
      console.error('[admin/cashless-kassen] toggle failed', err);
      errorMsg = errorMessage(
        err,
        t('Status konnte nicht geaendert werden.', 'Status could not be changed.'),
      );
    } finally {
      actingOn = null;
    }
  }
</script>

<svelte:head>
  <title>{t('Admin · Cashless-Kassen', 'Admin · Cashless registers')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-fg">
        {t('Cashless-Kassen', 'Cashless registers')}
      </h1>
      <p class="mt-3 max-w-2xl text-fg-muted">
        {t(
          'Stammdaten der Top-Up-Kassen. Schichten werden im Crew-Bereich unter',
          'Master data of the top-up registers. Shifts are managed in the crew area under',
        )}
        <a href="/crew/kasse" class="text-accent hover:underline">{t('Kasse', 'Cash register')}</a
        >{t(
          ' gefuehrt. Inaktive Kassen tauchen dort nicht mehr auf. Kassen werden nicht geloescht, damit die Schicht-Historie erhalten bleibt.',
          '. Inactive registers no longer show up there. Registers are not deleted so the shift history is preserved.',
        )}
      </p>
    </div>
    {#if !editing}
      <Button onclick={() => openEditor({ id: '', name: '', location: '', is_active: true })}>
        + {t('Neue Kasse', 'New cash register')}
      </Button>
    {/if}
  </div>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if editing}
    <form bind:this={editorEl} class="card mt-8 max-w-xl scroll-mt-6 p-6" onsubmit={save}>
      <h2 class="text-lg font-semibold text-fg">
        {editing.id
          ? t('Kasse bearbeiten', 'Edit cash register')
          : t('Neue Kasse', 'New cash register')}
      </h2>
      <label class="mt-5 block">
        <span class="text-sm text-fg-muted">Name</span>
        <input
          type="text"
          bind:value={editing.name}
          minlength="2"
          maxlength="80"
          required
          placeholder={t('z.B. Kasse Eingang', 'e.g. Entrance register')}
          class="field mt-1"
        />
      </label>
      <label class="mt-4 block">
        <span class="text-sm text-fg-muted">{t('Standort (optional)', 'Location (optional)')}</span>
        <input
          type="text"
          bind:value={editing.location}
          maxlength="120"
          placeholder={t('z.B. Haupteingang, Stage Right', 'e.g. main entrance, stage right')}
          class="field mt-1"
        />
      </label>
      <label class="mt-4 flex items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          bind:checked={editing.is_active}
          class="accent-[var(--color-accent)]"
        />
        {t('Aktiv', 'Active')}
      </label>
      {#if formError}
        <p class="mt-4 text-sm text-danger">{formError}</p>
      {/if}
      <div class="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}
          >{saving ? t('Speichere …', 'Saving …') : t('Speichern', 'Save')}</Button
        >
        <Button variant="ghost" onclick={() => (editing = null)} disabled={saving}>
          {t('Abbrechen', 'Cancel')}
        </Button>
      </div>
    </form>
  {/if}

  {#if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else if registers.length === 0}
    <div class="card mt-8 p-6">
      <p class="text-fg-muted">
        {t('Noch keine Kassen angelegt.', 'No cash registers created yet.')}
      </p>
    </div>
  {:else}
    <ul class="card mt-8 overflow-hidden">
      {#each registers as r (r.id)}
        {@const busy = actingOn === r.id}
        <li
          class="row flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium" class:text-fg={r.is_active} class:text-fg-muted={!r.is_active}>
              {r.name}
              <span
                class="ml-1 text-xs font-medium"
                class:text-success={r.is_active}
                class:text-fg-muted={!r.is_active}
              >
                ● {r.is_active ? t('aktiv', 'active') : t('inaktiv', 'inactive')}
              </span>
            </p>
            {#if r.location}
              <p class="mt-0.5 text-sm text-fg-muted">{r.location}</p>
            {/if}
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <button class="pill" disabled={busy} onclick={() => setActive(r, !r.is_active)}>
              {r.is_active ? t('Deaktivieren', 'Deactivate') : t('Aktivieren', 'Activate')}
            </button>
            <button class="pill" disabled={busy} onclick={() => openEditor({ ...r })}>
              {t('Bearbeiten', 'Edit')}
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
      border-color var(--dur-hover) var(--ease-out);
  }
  .pill:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .pill:not(:disabled):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
    }
  }
</style>
