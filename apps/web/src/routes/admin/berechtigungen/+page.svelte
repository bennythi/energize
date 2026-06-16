<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';
  import { DEFAULT_CREW_ROLES, type Level } from '$lib/crewResources';

  interface Resource {
    slug: string;
    label: string;
    description: string | null;
    sort_order: number;
  }
  interface RolePerm {
    role: string;
    resource_slug: string;
    level: Level;
  }
  interface UserPerm {
    user_id: string;
    resource_slug: string;
    level: Level;
  }
  interface UserRow {
    id: string;
    email: string;
    display_name: string | null;
  }

  let resources = $state<Resource[]>([]);
  let rolePerms = $state<RolePerm[]>([]);
  let userPerms = $state<UserPerm[]>([]);
  let users = $state<UserRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state(false);

  let newRole = $state('');
  let userSearch = $state('');

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
      const [resRes, rolesRes, userPermsRes, allUsersRes] = await Promise.all([
        client
          .from('crew_resources')
          .select('slug, label, description, sort_order')
          .order('sort_order'),
        client.from('crew_role_permissions').select('role, resource_slug, level'),
        client.from('crew_user_permissions').select('user_id, resource_slug, level'),
        client.rpc('admin_list_users'),
      ]);
      if (resRes.error) throw resRes.error;
      resources = (resRes.data ?? []) as Resource[];
      rolePerms = (rolesRes.data ?? []) as RolePerm[];
      userPerms = (userPermsRes.data ?? []) as UserPerm[];
      users = (allUsersRes.data ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
      }));
    } catch (err) {
      console.error('[admin/berechtigungen] load failed', err);
      errorMsg = 'Konnte Berechtigungen nicht laden. Sind die Migrationen 0015 bis 0018 gelaufen?';
    } finally {
      loading = false;
    }
  }

  const allRoles = $derived.by(() => {
    const set = new Set<string>(DEFAULT_CREW_ROLES);
    for (const rp of rolePerms) set.add(rp.role);
    return [...set].sort();
  });

  function levelFor(role: string, slug: string): Level | null {
    return rolePerms.find((p) => p.role === role && p.resource_slug === slug)?.level ?? null;
  }

  function userLevelFor(userId: string, slug: string): Level | null {
    return userPerms.find((p) => p.user_id === userId && p.resource_slug === slug)?.level ?? null;
  }

  async function setRolePerm(role: string, slug: string, level: Level | null) {
    const client = auth.client;
    if (!client) return;
    acting = true;
    errorMsg = null;
    try {
      const { error } = await client.rpc('admin_set_role_permission', {
        role,
        resource_slug: slug,
        new_level: level,
      });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[admin/berechtigungen] role perm failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  async function setUserPerm(userId: string, slug: string, level: Level | null) {
    const client = auth.client;
    if (!client) return;
    acting = true;
    errorMsg = null;
    try {
      const { error } = await client.rpc('admin_set_user_permission', {
        target_user_id: userId,
        resource_slug: slug,
        new_level: level,
      });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[admin/berechtigungen] user perm failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  function addRole() {
    const r = newRole.trim().toLowerCase().replace(/\s+/g, '_');
    if (!r) return;
    // Rolle ohne Permission bleibt nicht persistent. Damit sie in der
    // Tabelle erscheint, muss mindestens eine Permission gesetzt sein.
    newRole = '';
    // Wir setzen als Default 'read' auf die erste Resource, damit die
    // Rolle sichtbar ist. User kann das gleich anpassen.
    if (resources.length > 0) {
      void setRolePerm(r, resources[0].slug, 'read');
    }
  }

  const filteredUsers = $derived.by(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) {
      // Nur User mit mindestens einer Permission anzeigen
      const withPerms = new Set(userPerms.map((p) => p.user_id));
      return users.filter((u) => withPerms.has(u.id));
    }
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          (u.display_name ?? '').toLowerCase().includes(term),
      )
      .slice(0, 30);
  });

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Admin · Berechtigungen · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Admin / Berechtigungen
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Berechtigungen
    </h1>
    <p class="mt-3 max-w-2xl text-sm text-fg-muted">
      Pro Funktion (Resource) kannst du Rollen und Einzelpersonen Berechtigungen geben: lesen, lesen
      + bearbeiten oder lesen + bearbeiten + löschen. Admins haben automatisch alle Rechte und
      brauchen keinen Eintrag.
    </p>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else}
      <!-- Rollen-Matrix -->
      <section class="mt-10">
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          Rollen-Berechtigungen
        </h2>
        <p class="mt-1 text-xs text-fg-muted">
          Rollen kommen aus dem profiles.crew_roles-Feld. Setze pro Resource das Maximal-Level.
        </p>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  class="border-b border-border bg-surface p-2 text-left font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  Rolle
                </th>
                {#each resources as r (r.slug)}
                  <th
                    class="border-b border-border bg-surface p-2 text-left font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {r.label}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each allRoles as role (role)}
                <tr class="border-b border-border">
                  <td class="p-2 font-mono text-xs text-fg">{role}</td>
                  {#each resources as r (r.slug)}
                    {@const lvl = levelFor(role, r.slug)}
                    <td class="p-2">
                      <select
                        value={lvl ?? ''}
                        onchange={(e) => {
                          const v = (e.currentTarget as HTMLSelectElement).value;
                          void setRolePerm(role, r.slug, v === '' ? null : (v as Level));
                        }}
                        disabled={acting}
                        class="w-full border border-border bg-bg px-2 py-1 font-mono text-xs text-fg focus:border-accent focus:outline-none"
                      >
                        <option value="">kein Zugriff</option>
                        <option value="read">lesen</option>
                        <option value="write">+ bearbeiten</option>
                        <option value="delete">+ löschen</option>
                      </select>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex gap-2">
          <input
            type="text"
            bind:value={newRole}
            placeholder="Neue Rolle (z.B. logistik)"
            class="flex-1 border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
          <Button variant="ghost" onclick={addRole} disabled={acting}>+ Rolle</Button>
        </div>
      </section>

      <!-- User-Override-Matrix -->
      <section class="mt-12">
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          Einzelpersonen
        </h2>
        <p class="mt-1 text-xs text-fg-muted">
          Direkte Berechtigungen für einzelne User, unabhängig von ihren Rollen. Hat Vorrang
          gegenüber Rollen, wenn das Level höher ist.
        </p>

        <input
          type="search"
          bind:value={userSearch}
          placeholder="User suchen oder leer für Liste der bereits berechtigten"
          class="mt-3 w-full border-2 border-border bg-bg px-4 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />

        <div class="mt-4 overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  class="border-b border-border bg-surface p-2 text-left font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  User
                </th>
                {#each resources as r (r.slug)}
                  <th
                    class="border-b border-border bg-surface p-2 text-left font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {r.label}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as u (u.id)}
                <tr class="border-b border-border">
                  <td class="p-2 font-mono text-xs">
                    <span class="text-fg">{u.display_name ?? u.email}</span>
                    <div class="text-fg-muted">{u.email}</div>
                  </td>
                  {#each resources as r (r.slug)}
                    {@const lvl = userLevelFor(u.id, r.slug)}
                    <td class="p-2">
                      <select
                        value={lvl ?? ''}
                        onchange={(e) => {
                          const v = (e.currentTarget as HTMLSelectElement).value;
                          void setUserPerm(u.id, r.slug, v === '' ? null : (v as Level));
                        }}
                        disabled={acting}
                        class="w-full border border-border bg-bg px-2 py-1 font-mono text-xs text-fg focus:border-accent focus:outline-none"
                      >
                        <option value="">kein Zugriff</option>
                        <option value="read">lesen</option>
                        <option value="write">+ bearbeiten</option>
                        <option value="delete">+ löschen</option>
                      </select>
                    </td>
                  {/each}
                </tr>
              {/each}
              {#if filteredUsers.length === 0}
                <tr>
                  <td colspan={resources.length + 1} class="p-3 text-center text-sm text-fg-muted">
                    {userSearch ? 'Niemand gefunden.' : 'Noch keine User-Permissions vergeben.'}
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </section>
    {/if}
  </section>
</Container>
