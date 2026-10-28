<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';
  import {
    adminListCrew,
    adminListUsers,
    adminResendWelcome,
    adminSetFlags,
    errorMessage,
    type AdminUser,
  } from '$lib/crew-api';
  import { DEFAULT_CREW_ROLES } from '$lib/crewResources';
  import NewUserForm from '$lib/admin/NewUserForm.svelte';
  import { t } from '$lib/i18n';

  let crew = $state<AdminUser[]>([]);
  let allUsers = $state<AdminUser[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let actingOn = $state<string | null>(null);
  let search = $state('');
  let editingId = $state<string | null>(null);
  let customRole = $state('');
  let notice = $state<string | null>(null);

  async function resendWelcome(u: AdminUser) {
    if (
      !confirm(
        t(`Willkommensmail erneut an ${u.email} senden?`, `Resend welcome email to ${u.email}?`),
      )
    )
      return;
    actingOn = u.id;
    errorMsg = null;
    notice = null;
    try {
      await adminResendWelcome(u.id);
      notice = t(`Willkommensmail an ${u.email} gesendet.`, `Welcome email sent to ${u.email}.`);
    } catch (err) {
      errorMsg = errorMessage(
        err,
        t('Mail konnte nicht gesendet werden.', 'Email could not be sent.'),
      );
    } finally {
      actingOn = null;
    }
  }

  onMount(() => void load());

  async function load(showSkeleton = true) {
    if (showSkeleton) loading = true;
    try {
      const [c, u] = await Promise.all([adminListCrew(), adminListUsers()]);
      crew = c;
      allUsers = u;
    } catch (err) {
      console.error('[admin/crew] load failed', err);
      errorMsg = errorMessage(
        err,
        t('Crew-Daten konnten nicht geladen werden.', 'Crew data could not be loaded.'),
      );
    } finally {
      loading = false;
    }
  }

  function label(u: AdminUser): string {
    return u.display_name || u.email;
  }

  function normalizeRole(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, '_');
  }

  async function setCrewFlag(u: AdminUser, makeCrew: boolean) {
    if (
      !makeCrew &&
      !confirm(t(`${label(u)} das Crew-Recht entziehen?`, `Revoke crew access from ${label(u)}?`))
    )
      return;
    actingOn = u.id;
    errorMsg = null;
    try {
      await adminSetFlags(u.id, { is_crew: makeCrew });
      await load(false);
    } catch (err) {
      console.error('[admin/crew] toggle failed', err);
      errorMsg = errorMessage(
        err,
        t('Crew-Recht konnte nicht geaendert werden.', 'Crew access could not be changed.'),
      );
    } finally {
      actingOn = null;
    }
  }

  async function saveRoles(u: AdminUser, roles: string[]) {
    const prev = u.crew_roles;
    actingOn = u.id;
    errorMsg = null;
    // Optimistisch setzen, bei Fehler zuruecknehmen.
    crew = crew.map((m) => (m.id === u.id ? { ...m, crew_roles: roles } : m));
    try {
      await adminSetFlags(u.id, { crew_roles: roles });
    } catch (err) {
      console.error('[admin/crew] roles failed', err);
      crew = crew.map((m) => (m.id === u.id ? { ...m, crew_roles: prev } : m));
      errorMsg = errorMessage(
        err,
        t('Rollen konnten nicht gespeichert werden.', 'Roles could not be saved.'),
      );
    } finally {
      actingOn = null;
    }
  }

  function toggleRole(u: AdminUser, role: string) {
    const has = u.crew_roles.includes(role);
    void saveRoles(u, has ? u.crew_roles.filter((r) => r !== role) : [...u.crew_roles, role]);
  }

  function addCustomRole(u: AdminUser) {
    const role = normalizeRole(customRole);
    if (!role) return;
    customRole = '';
    if (u.crew_roles.includes(role)) return;
    void saveRoles(u, [...u.crew_roles, role]);
  }

  function roleOptions(u: AdminUser): string[] {
    return [...new Set([...DEFAULT_CREW_ROLES, ...u.crew_roles])];
  }

  const crewIds = $derived(new Set(crew.filter((c) => c.is_crew).map((c) => c.id)));

  const candidates = $derived.by(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return allUsers
      .filter((u) => !crewIds.has(u.id))
      .filter((u) => [u.email, u.display_name, u.handle].join(' ').toLowerCase().includes(term))
      .slice(0, 20);
  });
</script>

<svelte:head>
  <title>Admin · Crew</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <h1 class="text-3xl font-semibold tracking-tight text-fg">
    {t('Crew verwalten', 'Manage crew')}
  </h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Admin und Crew sind getrennte Rechte. Admins sind hier immer sichtbar und koennen das Crew-Recht zusaetzlich bekommen. Was eine Rolle darf, legst du unter',
      'Admin and crew are separate permissions. Admins are always visible here and can additionally be given crew access. You define what a role may do under',
    )}
    <a href="/admin/berechtigungen" class="text-accent hover:underline"
      >{t('Rechte', 'Permissions')}</a
    >{t(' fest.', '.')}
  </p>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger" role="alert">{errorMsg}</p>
  {/if}
  {#if notice}
    <p class="mt-4 text-sm text-success" role="status">{notice}</p>
  {/if}

  {#if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else}
    <!-- Neues Mitglied -->
    <NewUserForm onCreated={() => load(false)} />

    <!-- Bestehenden Account zur Crew -->
    <section class="card mt-6 p-6">
      <h2 class="text-lg font-semibold text-fg">
        {t('Bestehenden Account wieder zur Crew', 'Add existing account back to the crew')}
      </h2>
      <input
        type="search"
        bind:value={search}
        placeholder={t('Name, Handle oder E-Mail suchen …', 'Search name, handle or email …')}
        class="field mt-4"
        aria-label={t('User suchen', 'Search users')}
      />
      {#if search.trim()}
        <ul class="mt-3 flex flex-col">
          {#each candidates as u (u.id)}
            <li class="row flex items-center justify-between gap-4 py-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-fg">
                  {label(u)}
                  {#if u.role === 'admin'}<span class="badge badge-danger ml-1">Admin</span>{/if}
                </p>
                <p class="truncate text-xs text-fg-muted">{u.email}</p>
              </div>
              <button
                class="pill pill-on shrink-0"
                disabled={actingOn === u.id}
                onclick={() => setCrewFlag(u, true)}
              >
                {actingOn === u.id ? '…' : t('Zur Crew', 'Add to crew')}
              </button>
            </li>
          {:else}
            <li class="py-3 text-sm text-fg-muted">
              {t(
                'Niemand gefunden (oder schon in der Crew).',
                'Nobody found (or already in the crew).',
              )}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Aktive Crew -->
    <section class="mt-10">
      <h2 class="text-lg font-semibold text-fg">
        {t('Aktive Crew', 'Active crew')} <span class="text-fg-muted">{crew.length}</span>
      </h2>
      {#if crew.length === 0}
        <div class="card mt-4 p-6">
          <p class="text-fg-muted">
            {t(
              'Noch niemand. Vergib oben die ersten Crew-Rechte.',
              'Nobody yet. Grant the first crew access above.',
            )}
          </p>
        </div>
      {:else}
        <ul class="mt-4 flex flex-col gap-3">
          {#each crew as m (m.id)}
            {@const busy = actingOn === m.id}
            {@const editing = editingId === m.id}
            <li class="card p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="font-medium text-fg">{label(m)}</span>
                    {#if m.role === 'admin'}<span class="badge badge-danger">Admin</span>{/if}
                    {#if m.is_crew}<span class="badge badge-accent">Crew</span>{/if}
                    {#if m.id === auth.user?.id}<span class="text-xs text-fg-muted"
                        >{t('(du)', '(you)')}</span
                      >{/if}
                  </div>
                  <p class="mt-1 break-all text-xs text-fg-muted">{m.email}</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                  <button
                    class="pill"
                    class:pill-on={editing}
                    onclick={() => {
                      editingId = editing ? null : m.id;
                      customRole = '';
                    }}
                  >
                    {editing ? t('Fertig', 'Done') : t('Rollen bearbeiten', 'Edit roles')}
                  </button>
                  <button class="pill" disabled={busy} onclick={() => resendWelcome(m)}>
                    {t('Willkommensmail', 'Welcome email')}
                  </button>
                  {#if m.is_crew}
                    <button
                      class="pill pill-danger"
                      disabled={busy}
                      onclick={() => setCrewFlag(m, false)}
                    >
                      {t('Crew entziehen', 'Revoke crew')}
                    </button>
                  {:else}
                    <button class="pill" disabled={busy} onclick={() => setCrewFlag(m, true)}>
                      + Crew
                    </button>
                  {/if}
                </div>
              </div>

              {#if editing}
                <div class="mt-4 flex flex-wrap gap-2">
                  {#each roleOptions(m) as role (role)}
                    {@const on = m.crew_roles.includes(role)}
                    <button
                      class="chip"
                      class:chip-on={on}
                      aria-pressed={on}
                      disabled={busy}
                      onclick={() => toggleRole(m, role)}
                    >
                      {role}
                    </button>
                  {/each}
                </div>
                <form
                  class="mt-3 flex gap-2"
                  onsubmit={(e) => {
                    e.preventDefault();
                    addCustomRole(m);
                  }}
                >
                  <input
                    type="text"
                    bind:value={customRole}
                    placeholder={t('Eigene Rolle, z.B. buehne', 'Custom role, e.g. stage')}
                    class="field"
                    maxlength="40"
                    aria-label={t('Eigene Rolle', 'Custom role')}
                  />
                  <button class="pill shrink-0" type="submit" disabled={busy || !customRole.trim()}>
                    {t('Hinzufuegen', 'Add')}
                  </button>
                </form>
              {:else if m.crew_roles.length > 0}
                <div class="mt-3 flex flex-wrap gap-1.5">
                  {#each m.crew_roles as role (role)}
                    <span class="chip chip-static">{role}</span>
                  {/each}
                </div>
              {:else}
                <p class="mt-3 text-xs text-fg-muted">
                  {t('Keine Rollen zugewiesen.', 'No roles assigned.')}
                </p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>

<style>
  .row + .row {
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
  .pill,
  .chip {
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
  .chip {
    color: var(--color-fg-muted);
  }
  .chip-static {
    cursor: default;
    color: var(--color-fg);
  }
  .pill:disabled,
  .chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pill-on,
  .chip-on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    border-color: transparent;
  }
  @media (hover: hover) and (pointer: fine) {
    .pill:not(:disabled):not(.pill-on):hover,
    .chip:not(:disabled):not(.chip-on):not(.chip-static):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
      color: var(--color-fg);
    }
    .pill.pill-danger:not(:disabled):not(.pill-on):hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
</style>
