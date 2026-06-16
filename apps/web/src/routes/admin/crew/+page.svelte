<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface CrewRow {
    id: string;
    email: string;
    display_name: string | null;
    handle: string | null;
    role: 'user' | 'admin';
    is_crew: boolean;
    crew_roles: string[];
    avatar_path: string | null;
    created_at: string;
  }

  interface UserRow {
    id: string;
    email: string;
    display_name: string | null;
    handle: string | null;
    role: 'user' | 'admin';
  }

  let crew = $state<CrewRow[]>([]);
  let allUsers = $state<UserRow[]>([]);
  let loading = $state(true);
  let actingOn = $state<string | null>(null);
  let search = $state('');
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!auth.loading && auth.adminChecked && !auth.isAdmin) {
      void goto('/account', { replaceState: true });
    }
  });

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    try {
      const [crewRes, usersRes] = await Promise.all([
        client.rpc('admin_list_crew'),
        client.rpc('admin_list_users'),
      ]);
      if (crewRes.error) throw crewRes.error;
      if (usersRes.error) throw usersRes.error;
      crew = (crewRes.data ?? []) as CrewRow[];
      allUsers = (usersRes.data ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        handle: u.handle,
        role: u.role,
      }));
    } catch (err) {
      console.error('[admin/crew] load failed', err);
      errorMsg = 'Konnte Crew-Daten nicht laden. Sind die Migrationen 0013 + 0014 gelaufen?';
    } finally {
      loading = false;
    }
  }

  async function setCrewFlag(userId: string, makeCrew: boolean) {
    const client = auth.client;
    if (!client) return;
    actingOn = userId;
    errorMsg = null;
    try {
      const { error } = await client.rpc('admin_set_crew_role', {
        target_user_id: userId,
        make_crew: makeCrew,
        roles: [],
      });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[admin/crew] toggle failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      actingOn = null;
    }
  }

  const crewIds = $derived(new Set(crew.filter((c) => c.is_crew).map((c) => c.id)));

  const candidates = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return allUsers
      .filter((u) => !crewIds.has(u.id))
      .filter((u) => {
        if (!term) return true;
        return (
          u.email.toLowerCase().includes(term) ||
          (u.display_name ?? '').toLowerCase().includes(term) ||
          (u.handle ?? '').toLowerCase().includes(term)
        );
      })
      .slice(0, 30);
  });

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Admin · Crew · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Admin / Crew
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Crew verwalten
    </h1>
    <p class="mt-3 max-w-2xl text-sm text-fg-muted">
      Admin und Crew sind getrennte Rechte. Admins können das Crew-Recht unabhängig vergeben oder
      sich selbst geben. Feinere Crew-Rollen (Technik, Kommunikation, Infrastruktur) folgen später.
    </p>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else}
      <!-- Liste der aktiven Crew + Admins -->
      <section class="mt-10">
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          Aktive Crew ({crew.length})
        </h2>
        <p class="mt-1 text-xs text-fg-muted">
          Admins sind hier auch sichtbar. Sie zählen automatisch als Crew, können das explizite
          Crew-Recht aber auch zusätzlich bekommen.
        </p>
        {#if crew.length === 0}
          <p class="mt-3 text-sm text-fg-muted">
            Noch niemand. Vergib unten die ersten Crew-Rechte.
          </p>
        {:else}
          <ul class="mt-3 divide-y divide-border border-y border-border">
            {#each crew as member (member.id)}
              {@const isMe = member.id === auth.user?.id}
              <li class="flex items-center justify-between gap-4 p-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate font-mono text-sm text-fg">
                    {member.display_name ?? member.email}
                    {#if isMe}
                      <span class="ml-1 font-mono text-[10px] text-fg-muted">(du)</span>
                    {/if}
                  </p>
                  <p class="font-mono text-xs text-fg-muted">{member.email}</p>
                  <div class="mt-1 flex flex-wrap gap-1">
                    {#if member.role === 'admin'}
                      <span
                        class="border border-[var(--color-red,#E24B4A)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-[var(--color-red,#E24B4A)]"
                      >
                        Admin
                      </span>
                    {/if}
                    {#if member.is_crew}
                      <span
                        class="border border-accent px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
                      >
                        Crew
                      </span>
                    {/if}
                  </div>
                </div>
                <div class="flex shrink-0 gap-2">
                  {#if !member.is_crew}
                    <!-- Admin ohne explizites Crew-Flag: optional Crew geben -->
                    <button
                      onclick={() => setCrewFlag(member.id, true)}
                      disabled={actingOn === member.id}
                      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline disabled:opacity-50"
                    >
                      {actingOn === member.id ? '...' : '+ Crew'}
                    </button>
                  {:else}
                    <button
                      onclick={() => setCrewFlag(member.id, false)}
                      disabled={actingOn === member.id}
                      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)] disabled:opacity-50"
                    >
                      {actingOn === member.id ? '...' : 'Crew entziehen'}
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- User zur Crew machen -->
      <section class="mt-12">
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          Crew-Recht vergeben
        </h2>
        <input
          type="search"
          bind:value={search}
          placeholder="Name, Handle oder Email suchen"
          class="mt-3 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        <ul class="mt-3 divide-y divide-border border-y border-border">
          {#each candidates as u (u.id)}
            <li class="flex items-center justify-between gap-4 p-3">
              <div class="min-w-0 flex-1">
                <p class="truncate font-mono text-sm text-fg">
                  {u.display_name ?? u.email}
                  {#if u.role === 'admin'}
                    <span
                      class="ml-2 border border-[var(--color-red,#E24B4A)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-[var(--color-red,#E24B4A)]"
                    >
                      Admin
                    </span>
                  {/if}
                </p>
                <p class="font-mono text-xs text-fg-muted">{u.email}</p>
              </div>
              <Button
                variant="ghost"
                onclick={() => setCrewFlag(u.id, true)}
                disabled={actingOn === u.id}
              >
                {actingOn === u.id ? '...' : 'Crew geben'}
              </Button>
            </li>
          {/each}
          {#if candidates.length === 0}
            <li class="p-3 text-sm text-fg-muted">
              {search ? 'Niemand gefunden.' : 'Alle User haben bereits Crew-Recht.'}
            </li>
          {/if}
        </ul>
      </section>
    {/if}
  </section>
</Container>
