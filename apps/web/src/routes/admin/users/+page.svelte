<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte';
  import NewUserForm from '$lib/admin/NewUserForm.svelte';
  import { t, locale } from '$lib/i18n';
  import {
    adminDeleteUser,
    adminListUsers,
    adminSetFlags,
    adminSetPassword,
    errorMessage,
    generatePassword,
    type AdminUser,
  } from '$lib/crew-api';

  let items = $state<AdminUser[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let actingOn = $state<string | null>(null);
  let search = $state('');
  // Zuletzt erzeugtes Startpasswort (nur einmal angezeigt).
  let issued = $state<{ email: string; password: string } | null>(null);
  let showNew = $state(false);

  onMount(() => void load());

  async function load(showSkeleton = true) {
    if (showSkeleton) loading = true;
    errorMsg = null;
    try {
      items = await adminListUsers();
    } catch (err) {
      console.error('[admin/users] load failed', err);
      errorMsg = errorMessage(
        err,
        t('User konnten nicht geladen werden.', 'Users could not be loaded.'),
      );
      items = [];
    } finally {
      loading = false;
    }
  }

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.email, u.display_name, u.handle, u.phone].join(' ').toLowerCase().includes(q),
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
    const question =
      role === 'admin'
        ? t(`${label(u)}: wirklich zum Admin machen?`, `${label(u)}: really make admin?`)
        : t(
            `${label(u)}: wirklich die Admin-Rolle entziehen?`,
            `${label(u)}: really revoke the admin role?`,
          );
    if (!confirm(question)) return;
    if (isMe && role !== 'admin') {
      if (
        !confirm(
          t(
            'Du entziehst dir SELBST die Admin-Rechte und verlierst den Zugang. Sicher?',
            'You are revoking your OWN admin rights and will lose access. Are you sure?',
          ),
        )
      )
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
      errorMsg = errorMessage(
        err,
        t('Rolle konnte nicht gesetzt werden.', 'Role could not be set.'),
      );
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
      errorMsg = errorMessage(
        err,
        t('Crew-Status konnte nicht geaendert werden.', 'Crew status could not be changed.'),
      );
    } finally {
      actingOn = null;
    }
  }

  async function deleteUser(u: AdminUser) {
    if (u.id === auth.user?.id) return;
    if (
      !confirm(
        t(
          `${label(u)} ENDGUELTIG loeschen?\n\nProfil, Flags und alle verknuepften Daten werden mitgeloescht. Das kann nicht rueckgaengig gemacht werden.`,
          `PERMANENTLY delete ${label(u)}?\n\nProfile, flags and all linked data will be deleted too. This cannot be undone.`,
        ),
      )
    )
      return;
    const localPart = u.email.split('@')[0];
    const typed = prompt(
      t(
        `Zur Sicherheit bitte "${localPart}" eintippen.`,
        `To be safe, please type "${localPart}".`,
      ),
    );
    if (typed === null) return;
    if (typed.trim() !== localPart) {
      errorMsg = t(
        'Eingabe stimmt nicht ueberein, Loeschen abgebrochen.',
        'Input does not match, deletion cancelled.',
      );
      return;
    }
    actingOn = u.id;
    errorMsg = null;
    try {
      await adminDeleteUser(u.id);
      items = items.filter((x) => x.id !== u.id);
    } catch (err) {
      console.error('[admin/users] delete failed', err);
      errorMsg = errorMessage(
        err,
        t('User konnte nicht geloescht werden.', 'User could not be deleted.'),
      );
    } finally {
      actingOn = null;
    }
  }

  async function setPassword(u: AdminUser) {
    if (
      !confirm(
        t(
          `Neues Startpasswort fuer ${label(u)} erzeugen? Ein altes Passwort gilt danach nicht mehr.`,
          `Generate a new initial password for ${label(u)}? Any old password will stop working.`,
        ),
      )
    )
      return;
    actingOn = u.id;
    errorMsg = null;
    issued = null;
    const password = generatePassword();
    try {
      await adminSetPassword(u.id, password);
      issued = { email: u.email, password };
    } catch (err) {
      console.error('[admin/users] setPassword failed', err);
      errorMsg = errorMessage(
        err,
        t('Passwort konnte nicht gesetzt werden.', 'Password could not be set.'),
      );
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
    else
      errorMsg = t(
        'Ansicht als dieser User konnte nicht gestartet werden.',
        'Could not start viewing as this user.',
      );
  }

  function fmtDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Admin · User</title>
</svelte:head>

{#snippet badges(u: AdminUser)}
  {#if u.role === 'admin'}<span class="badge badge-danger">Admin</span>{/if}
  {#if u.is_crew}<span class="badge badge-accent">Crew</span>{/if}
  {#if u.id === auth.user?.id}<span class="text-xs text-fg-muted">{t('(du)', '(you)')}</span>{/if}
{/snippet}

{#snippet actions(u: AdminUser)}
  {@const isMe = u.id === auth.user?.id}
  {@const busy = actingOn === u.id}
  <div class="flex flex-wrap gap-2">
    {#if u.role === 'admin'}
      <button class="pill" disabled={busy} onclick={() => setRole(u, 'user')}>
        {t('Admin entziehen', 'Revoke admin')}
      </button>
    {:else}
      <button class="pill" disabled={busy} onclick={() => setRole(u, 'admin')}>
        {t('Zum Admin', 'Make admin')}
      </button>
    {/if}
    <button class="pill" disabled={busy} onclick={() => toggleCrew(u)}>
      {u.is_crew ? t('Crew entziehen', 'Revoke crew') : t('Crew geben', 'Grant crew')}
    </button>
    <button class="pill" disabled={busy} onclick={() => setPassword(u)}
      >{t('Startpasswort', 'Initial password')}</button
    >
    <button
      class="pill"
      disabled={busy || isMe}
      title={isMe
        ? t('Das bist du selbst', 'That is you')
        : t('App aus Sicht dieses Users ansehen', 'View the app as this user')}
      onclick={() => viewAs(u)}
    >
      {t('Ansehen als', 'View as')}
    </button>
    <button
      class="pill pill-danger"
      disabled={busy || isMe}
      title={isMe
        ? t('Du kannst dich nicht selbst loeschen', 'You cannot delete yourself')
        : t('User endgueltig loeschen', 'Permanently delete user')}
      onclick={() => deleteUser(u)}
    >
      {t('Loeschen', 'Delete')}
    </button>
  </div>
{/snippet}

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <div class="flex flex-wrap items-baseline justify-between gap-3">
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      User
      {#if !loading}<span class="text-fg-muted">{items.length}</span>{/if}
    </h1>
    {#if !showNew}
      <button class="pill pill-on" onclick={() => (showNew = true)}
        >+ {t('Neuen User anlegen', 'Create new user')}</button
      >
    {/if}
  </div>

  {#if showNew}
    <NewUserForm onCreated={() => load(false)} onCancel={() => (showNew = false)} />
  {/if}

  <input
    type="search"
    bind:value={search}
    placeholder={t(
      'E-Mail, Name oder Handynummer suchen …',
      'Search email, name or mobile number …',
    )}
    class="field mt-6 sm:max-w-md"
    aria-label={t('User suchen', 'Search users')}
  />

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if issued}
    <div class="card mt-4 flex flex-wrap items-center justify-between gap-3 p-4" role="status">
      <p class="text-sm text-fg">
        {t('Startpasswort fuer', 'Initial password for')} <strong>{issued.email}</strong>:
        <code class="ml-1 select-all rounded bg-black/30 px-2 py-0.5 font-mono text-accent"
          >{issued.password}</code
        >
        <span class="block text-xs text-fg-muted"
          >{t(
            'Wird nur jetzt angezeigt. Weitergeben und unter Account aendern lassen.',
            'Shown only now. Hand it over and have it changed under Account.',
          )}</span
        >
      </p>
      <button class="pill" onclick={() => (issued = null)}>{t('Ausblenden', 'Dismiss')}</button>
    </div>
  {/if}

  {#if loading}
    <div class="card mt-6 h-40 animate-pulse opacity-50"></div>
  {:else if filtered.length === 0}
    <div class="card mt-6 p-6">
      <p class="text-fg-muted">
        {search ? t('Keine Treffer.', 'No matches.') : t('Noch keine User.', 'No users yet.')}
      </p>
    </div>
  {:else}
    <!-- Desktop: Tabelle -->
    <div class="card mt-6 hidden overflow-x-auto md:block">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-xs uppercase tracking-wider text-fg-muted">
            <th class="px-5 py-3 font-medium">User</th>
            <th class="px-5 py-3 font-medium">Status</th>
            <th class="px-5 py-3 font-medium">{t('Registriert', 'Registered')}</th>
            <th class="px-5 py-3 font-medium">{t('Aktionen', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as u (u.id)}
            <tr class="row">
              <td class="px-5 py-3 align-top">
                <p class="font-medium text-fg">{u.display_name || t('(kein Name)', '(no name)')}</p>
                <p class="text-xs text-fg-muted">
                  {u.email}{#if u.phone}
                    · {u.phone}{/if}
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
            <span class="font-medium text-fg"
              >{u.display_name || t('(kein Name)', '(no name)')}</span
            >
            {@render badges(u)}
          </div>
          <p class="mt-1 break-all text-xs text-fg-muted">{u.email}</p>
          <p class="mt-1 text-xs text-fg-muted">
            {#if u.phone}{u.phone} ·
            {/if}{t('registriert', 'registered')}
            {fmtDate(u.created)}
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
  .pill-on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    border-color: transparent;
  }
  .pill:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .pill:not(:disabled):not(.pill-on):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
    }
    .pill-danger:not(:disabled):hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
</style>
