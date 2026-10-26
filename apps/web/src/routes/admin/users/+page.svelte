<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte';
  import {
    adminDeleteUser,
    adminListUsers,
    adminSetFlags,
    errorMessage,
    type AdminUser,
  } from '$lib/crew-api';

  let items = $state<AdminUser[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let actingOn = $state<string | null>(null);
  let search = $state('');

  onMount(() => void load());

  async function load() {
    loading = true;
    errorMsg = null;
    try {
      items = await adminListUsers();
    } catch (err) {
      console.error('[admin/users] load failed', err);
      errorMsg = errorMessage(err, 'User konnten nicht geladen werden.');
      items = [];
    } finally {
      loading = false;
    }
  }

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.email, u.display_name, u.handle].join(' ').toLowerCase().includes(q),
    );
  });

  function label(u: AdminUser): string {
    return u.display_name || u.email;
  }

  function patchLocal(id: string, patch: Partial<AdminUser>) {
    items = items.map((u) => (u.id === id ? { ...u, ...patch } : u));
  }

  async function setRole(u: AdminUser, role: 'user' | 'admin') {
    const isMe = u.id === auth.user?.id;
    const verb = role === 'admin' ? 'zum Admin machen' : 'die Admin-Rolle entziehen';
    if (!confirm(`${label(u)}: wirklich ${verb}?`)) return;
    if (isMe && role !== 'admin') {
      if (!confirm('Du entziehst dir SELBST die Admin-Rechte und verlierst den Zugang. Sicher?'))
        return;
    }
    actingOn = u.id;
    errorMsg = null;
    try {
      await adminSetFlags(u.id, { role });
      patchLocal(u.id, { role });
      if (isMe) await goto('/account', { replaceState: true });
    } catch (err) {
      console.error('[admin/users] setRole failed', err);
      errorMsg = errorMessage(err, 'Rolle konnte nicht gesetzt werden.');
    } finally {
      actingOn = null;
    }
  }

  async function toggleCrew(u: AdminUser) {
    actingOn = u.id;
    errorMsg = null;
    try {
      await adminSetFlags(u.id, { is_crew: !u.is_crew });
      patchLocal(u.id, { is_crew: !u.is_crew });
    } catch (err) {
      console.error('[admin/users] toggleCrew failed', err);
      errorMsg = errorMessage(err, 'Crew-Status konnte nicht geaendert werden.');
    } finally {
      actingOn = null;
    }
  }

  async function deleteUser(u: AdminUser) {
    if (u.id === auth.user?.id) return;
    if (
      !confirm(
        `${label(u)} ENDGUELTIG loeschen?\n\nProfil, Flags und alle verknuepften Daten werden mitgeloescht. Das kann nicht rueckgaengig gemacht werden.`,
      )
    )
      return;
    const localPart = u.email.split('@')[0];
    const typed = prompt(`Zur Sicherheit bitte "${localPart}" eintippen.`);
    if (typed === null) return;
    if (typed.trim() !== localPart) {
      errorMsg = 'Eingabe stimmt nicht ueberein, Loeschen abgebrochen.';
      return;
    }
    actingOn = u.id;
    errorMsg = null;
    try {
      await adminDeleteUser(u.id);
      items = items.filter((x) => x.id !== u.id);
    } catch (err) {
      console.error('[admin/users] delete failed', err);
      errorMsg = errorMessage(err, 'User konnte nicht geloescht werden.');
    } finally {
      actingOn = null;
    }
  }

  async function viewAs(u: AdminUser) {
    actingOn = u.id;
    errorMsg = null;
    await auth.enterViewAs(u.id);
    actingOn = null;
    if (auth.viewAs) await goto('/crew');
    else errorMsg = 'Ansicht als dieser User konnte nicht gestartet werden.';
  }

  function fmtDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Admin · User</title>
</svelte:head>

{#snippet badges(u: AdminUser)}
  {#if u.role === 'admin'}<span class="badge badge-danger">Admin</span>{/if}
  {#if u.is_crew}<span class="badge badge-accent">Crew</span>{/if}
  {#if u.id === auth.user?.id}<span class="text-xs text-fg-muted">(du)</span>{/if}
{/snippet}

{#snippet actions(u: AdminUser)}
  {@const isMe = u.id === auth.user?.id}
  {@const busy = actingOn === u.id}
  <div class="flex flex-wrap gap-2">
    {#if u.role === 'admin'}
      <button class="pill" disabled={busy} onclick={() => setRole(u, 'user')}>
        Admin entziehen
      </button>
    {:else}
      <button class="pill" disabled={busy} onclick={() => setRole(u, 'admin')}> Zum Admin </button>
    {/if}
    <button class="pill" disabled={busy} onclick={() => toggleCrew(u)}>
      {u.is_crew ? 'Crew entziehen' : 'Crew geben'}
    </button>
    <button
      class="pill"
      disabled={busy || isMe}
      title={isMe ? 'Das bist du selbst' : 'App aus Sicht dieses Users ansehen'}
      onclick={() => viewAs(u)}
    >
      Ansehen als
    </button>
    <button
      class="pill pill-danger"
      disabled={busy || isMe}
      title={isMe ? 'Du kannst dich nicht selbst loeschen' : 'User endgueltig loeschen'}
      onclick={() => deleteUser(u)}
    >
      Loeschen
    </button>
  </div>
{/snippet}

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <div class="flex flex-wrap items-baseline justify-between gap-3">
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      User
      {#if !loading}<span class="text-fg-muted">{items.length}</span>{/if}
    </h1>
  </div>

  <input
    type="search"
    bind:value={search}
    placeholder="E-Mail, Name oder Handle suchen …"
    class="field mt-6 sm:max-w-md"
    aria-label="User suchen"
  />

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if loading}
    <div class="card mt-6 h-40 animate-pulse opacity-50"></div>
  {:else if filtered.length === 0}
    <div class="card mt-6 p-6">
      <p class="text-fg-muted">{search ? 'Keine Treffer.' : 'Noch keine User.'}</p>
    </div>
  {:else}
    <!-- Desktop: Tabelle -->
    <div class="card mt-6 hidden overflow-x-auto md:block">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-xs uppercase tracking-wider text-fg-muted">
            <th class="px-5 py-3 font-medium">User</th>
            <th class="px-5 py-3 font-medium">Status</th>
            <th class="px-5 py-3 font-medium">Registriert</th>
            <th class="px-5 py-3 font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as u (u.id)}
            <tr class="row">
              <td class="px-5 py-3 align-top">
                <p class="font-medium text-fg">{u.display_name || '(kein Name)'}</p>
                <p class="text-xs text-fg-muted">
                  {u.email}{#if u.handle}
                    · @{u.handle}{/if}
                </p>
              </td>
              <td class="px-5 py-3 align-top">
                <div class="flex flex-wrap items-center gap-1.5">
                  {@render badges(u)}
                  {#if u.role !== 'admin' && !u.is_crew}<span class="text-xs text-fg-muted"
                      >User</span
                    >{/if}
                </div>
              </td>
              <td class="whitespace-nowrap px-5 py-3 align-top text-fg-muted">
                {fmtDate(u.created)}
              </td>
              <td class="px-5 py-3 align-top">{@render actions(u)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobil: Karten -->
    <ul class="mt-6 flex flex-col gap-3 md:hidden">
      {#each filtered as u (u.id)}
        <li class="card p-5">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-medium text-fg">{u.display_name || '(kein Name)'}</span>
            {@render badges(u)}
          </div>
          <p class="mt-1 break-all text-xs text-fg-muted">{u.email}</p>
          <p class="mt-1 text-xs text-fg-muted">
            {#if u.handle}@{u.handle} ·
            {/if}registriert {fmtDate(u.created)}
          </p>
          <div class="mt-4">{@render actions(u)}</div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .row {
    border-top: 1px solid var(--glass-border);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid currentColor;
  }
  .badge-accent {
    color: var(--color-accent);
  }
  .badge-danger {
    color: var(--color-danger);
  }
  .pill {
    padding: 0.35rem 0.8rem;
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
  @media (hover: hover) and (pointer: fine) {
    .pill:not(:disabled):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
    }
    .pill-danger:not(:disabled):hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
</style>
