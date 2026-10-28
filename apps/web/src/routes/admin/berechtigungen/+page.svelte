<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListUsers,
    adminPermissions,
    adminSetRolePermission,
    adminSetUserPermission,
    errorMessage,
    type AdminUser,
    type PermissionsOverview,
  } from '$lib/crew-api';
  import {
    CREW_RESOURCE_LABELS,
    DEFAULT_CREW_ROLES,
    type CrewResource,
    type Level,
  } from '$lib/crewResources';
  import { isModuleEnabled, MODULE_REGISTRY } from '$lib/modules';
  import type { ModuleSlug } from '@platform/modules';
  import { t, isEn } from '$lib/i18n';

  type Resource = PermissionsOverview['resources'][number];

  let resources = $state<Resource[]>([]);
  let rolePerms = $state<PermissionsOverview['rolePermissions']>([]);
  let userPerms = $state<PermissionsOverview['userPermissions']>([]);
  let users = $state<AdminUser[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let savingKey = $state<string | null>(null);

  let newRole = $state('');
  let extraRoles = $state<string[]>([]);
  let userSearch = $state('');
  let pinnedUsers = $state<string[]>([]);

  const LEVEL_OPTIONS: { value: '' | Level; label: string }[] = [
    { value: '', label: '—' },
    { value: 'read', label: t('lesen', 'read') },
    { value: 'write', label: t('+ bearbeiten', '+ write') },
    { value: 'delete', label: t('+ loeschen', '+ delete') },
  ];

  onMount(() => void load());

  async function load() {
    loading = true;
    errorMsg = null;
    try {
      const [overview, u] = await Promise.all([adminPermissions(), adminListUsers()]);
      resources = overview.resources.filter((r) => {
        // Ressourcen deaktivierter Module ausblenden.
        if (!r.module || !(r.module in MODULE_REGISTRY)) return true;
        return isModuleEnabled(r.module as ModuleSlug);
      });
      rolePerms = overview.rolePermissions;
      userPerms = overview.userPermissions;
      users = u;
    } catch (err) {
      console.error('[admin/berechtigungen] load failed', err);
      errorMsg = errorMessage(
        err,
        t('Berechtigungen konnten nicht geladen werden.', 'Permissions could not be loaded.'),
      );
    } finally {
      loading = false;
    }
  }

  function resourceLabel(r: Resource): string {
    // r.label kommt deutsch aus der DB; auf Englisch die uebersetzte Map bevorzugen.
    const mapped = CREW_RESOURCE_LABELS[r.slug as CrewResource]?.label;
    if (isEn && mapped) return mapped;
    return r.label || mapped || r.slug;
  }

  const allRoles = $derived.by(() => {
    const set = new Set<string>([...DEFAULT_CREW_ROLES, ...extraRoles]);
    for (const rp of rolePerms) set.add(rp.role);
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  function roleLevel(role: string, slug: string): Level | '' {
    return rolePerms.find((p) => p.role === role && p.resource === slug)?.level ?? '';
  }

  function userLevel(userId: string, slug: string): Level | '' {
    return userPerms.find((p) => p.user === userId && p.resource === slug)?.level ?? '';
  }

  async function setRolePerm(role: string, slug: string, value: string) {
    const level = value === '' ? null : (value as Level);
    const prev = rolePerms;
    const key = `r:${role}:${slug}`;
    savingKey = key;
    errorMsg = null;
    const rest = rolePerms.filter((p) => !(p.role === role && p.resource === slug));
    rolePerms = level ? [...rest, { role, resource: slug, level }] : rest;
    try {
      await adminSetRolePermission(role, slug, level);
    } catch (err) {
      console.error('[admin/berechtigungen] role perm failed', err);
      rolePerms = prev;
      errorMsg = errorMessage(
        err,
        t('Recht konnte nicht gespeichert werden.', 'Permission could not be saved.'),
      );
    } finally {
      if (savingKey === key) savingKey = null;
    }
  }

  async function setUserPerm(userId: string, slug: string, value: string) {
    const level = value === '' ? null : (value as Level);
    const prev = userPerms;
    const key = `u:${userId}:${slug}`;
    savingKey = key;
    errorMsg = null;
    const rest = userPerms.filter((p) => !(p.user === userId && p.resource === slug));
    userPerms = level ? [...rest, { user: userId, resource: slug, level }] : rest;
    if (!pinnedUsers.includes(userId)) pinnedUsers = [...pinnedUsers, userId];
    try {
      await adminSetUserPermission(userId, slug, level);
    } catch (err) {
      console.error('[admin/berechtigungen] user perm failed', err);
      userPerms = prev;
      errorMsg = errorMessage(
        err,
        t('Recht konnte nicht gespeichert werden.', 'Permission could not be saved.'),
      );
    } finally {
      if (savingKey === key) savingKey = null;
    }
  }

  function addRole(e: SubmitEvent) {
    e.preventDefault();
    const r = newRole.trim().toLowerCase().replace(/\s+/g, '_');
    newRole = '';
    if (!r || allRoles.includes(r)) return;
    extraRoles = [...extraRoles, r];
  }

  // Ohne Suche: alle User mit mindestens einem Override (plus gerade bearbeitete).
  const visibleUsers = $derived.by(() => {
    const term = userSearch.trim().toLowerCase();
    if (term) {
      return users
        .filter((u) => [u.email, u.display_name, u.handle].join(' ').toLowerCase().includes(term))
        .slice(0, 30);
    }
    const withPerms = new Set([...userPerms.map((p) => p.user), ...pinnedUsers]);
    return users.filter((u) => withPerms.has(u.id));
  });
</script>

<svelte:head>
  <title>{t('Admin · Rechte', 'Admin · Permissions')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
  <h1 class="text-3xl font-semibold tracking-tight text-fg">
    {t('Berechtigungen', 'Permissions')}
  </h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Pro Bereich bekommen Rollen oder einzelne Personen ein Level: lesen, bearbeiten oder zusaetzlich loeschen. Admins haben automatisch alle Rechte. Aenderungen werden sofort gespeichert.',
      'Per area, roles or individual people get a level: read, write or additionally delete. Admins automatically have all permissions. Changes are saved immediately.',
    )}
  </p>

  {#if errorMsg}
    <p class="mt-4 text-sm text-danger">{errorMsg}</p>
  {/if}

  {#if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else}
    <!-- Rollen-Matrix -->
    <section class="mt-8">
      <h2 class="text-lg font-semibold text-fg">{t('Rollen', 'Roles')}</h2>
      <p class="mt-1 text-sm text-fg-muted">
        {t('Rollen werden unter', 'Roles are assigned to people under')}
        <a href="/admin/crew" class="text-accent hover:underline">Crew</a>{t(
          ' an Personen vergeben.',
          '.',
        )}
      </p>

      <div class="card mt-4 overflow-x-auto">
        <table class="matrix w-full text-left text-sm">
          <thead>
            <tr class="text-xs uppercase tracking-wider text-fg-muted">
              <th class="sticky-col px-4 py-3 font-medium">{t('Rolle', 'Role')}</th>
              {#each resources as r (r.slug)}
                <th class="px-3 py-3 font-medium whitespace-nowrap">{resourceLabel(r)}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each allRoles as role (role)}
              <tr class="row">
                <td class="sticky-col px-4 py-2 font-mono text-xs text-fg">{role}</td>
                {#each resources as r (r.slug)}
                  {@const lvl = roleLevel(role, r.slug)}
                  <td class="px-3 py-2">
                    <select
                      class="lvl"
                      class:lvl-set={lvl !== ''}
                      value={lvl}
                      disabled={savingKey === `r:${role}:${r.slug}`}
                      aria-label="{role}: {resourceLabel(r)}"
                      onchange={(e) => setRolePerm(role, r.slug, e.currentTarget.value)}
                    >
                      {#each LEVEL_OPTIONS as o (o.value)}
                        <option value={o.value}>{o.label}</option>
                      {/each}
                    </select>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <form class="mt-4 flex max-w-md gap-2" onsubmit={addRole}>
        <input
          type="text"
          bind:value={newRole}
          placeholder={t('Neue Rolle, z.B. buehne', 'New role, e.g. stage')}
          class="field"
          maxlength="40"
          aria-label={t('Neue Rolle', 'New role')}
        />
        <button type="submit" class="pill shrink-0" disabled={!newRole.trim()}
          >+ {t('Rolle', 'Role')}</button
        >
      </form>
      <p class="mt-2 text-xs text-fg-muted">
        {t(
          'Eine neue Rolle bleibt nur erhalten, wenn mindestens ein Recht gesetzt ist.',
          'A new role is only kept if at least one permission is set.',
        )}
      </p>
    </section>

    <!-- Einzelpersonen -->
    <section class="mt-12">
      <h2 class="text-lg font-semibold text-fg">{t('Einzelpersonen', 'Individuals')}</h2>
      <p class="mt-1 text-sm text-fg-muted">
        {t(
          'Direkte Rechte fuer einzelne User, unabhaengig von ihren Rollen. Es gilt jeweils das hoehere Level.',
          'Direct permissions for individual users, independent of their roles. The higher level applies.',
        )}
      </p>

      <input
        type="search"
        bind:value={userSearch}
        placeholder={t(
          'User suchen, leer = alle mit Einzelrechten',
          'Search users, empty = all with individual permissions',
        )}
        class="field mt-4 sm:max-w-md"
        aria-label={t('User suchen', 'Search users')}
      />

      {#if visibleUsers.length === 0}
        <div class="card mt-4 p-6">
          <p class="text-fg-muted">
            {userSearch.trim()
              ? t('Niemand gefunden.', 'Nobody found.')
              : t('Noch keine Einzelrechte vergeben.', 'No individual permissions granted yet.')}
          </p>
        </div>
      {:else}
        <div class="card mt-4 overflow-x-auto">
          <table class="matrix w-full text-left text-sm">
            <thead>
              <tr class="text-xs uppercase tracking-wider text-fg-muted">
                <th class="sticky-col px-4 py-3 font-medium">User</th>
                {#each resources as r (r.slug)}
                  <th class="px-3 py-3 font-medium whitespace-nowrap">{resourceLabel(r)}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each visibleUsers as u (u.id)}
                <tr class="row">
                  <td class="sticky-col px-4 py-2">
                    <p class="max-w-[12rem] truncate text-fg">{u.display_name || u.email}</p>
                    {#if u.display_name}
                      <p class="max-w-[12rem] truncate text-xs text-fg-muted">{u.email}</p>
                    {/if}
                  </td>
                  {#each resources as r (r.slug)}
                    {@const lvl = userLevel(u.id, r.slug)}
                    <td class="px-3 py-2">
                      <select
                        class="lvl"
                        class:lvl-set={lvl !== ''}
                        value={lvl}
                        disabled={savingKey === `u:${u.id}:${r.slug}`}
                        aria-label="{u.display_name || u.email}: {resourceLabel(r)}"
                        onchange={(e) => setUserPerm(u.id, r.slug, e.currentTarget.value)}
                      >
                        {#each LEVEL_OPTIONS as o (o.value)}
                          <option value={o.value}>{o.label}</option>
                        {/each}
                      </select>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .row {
    border-top: 1px solid var(--glass-border);
  }
  .sticky-col {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--color-bg);
  }
  .lvl {
    min-width: 7.5rem;
    background-color: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 0.35rem 0.5rem;
    color: var(--color-fg-muted);
    font-size: 0.8rem;
    cursor: pointer;
    transition: border-color var(--dur-hover) var(--ease-out);
  }
  .lvl:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  .lvl:disabled {
    opacity: 0.5;
  }
  .lvl-set {
    color: var(--color-fg);
    border-color: var(--color-accent);
  }
  .lvl option {
    background-color: var(--color-bg);
    color: var(--color-fg);
  }
  .pill {
    padding: 0.55rem 1rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg);
    font-size: 0.85rem;
    font-weight: 500;
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
