<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  const FOUNDER_EMAIL = 'benjamin.thiel@outlook.com';

  interface UserRow {
    id: string;
    email: string;
    display_name: string | null;
    handle: string | null;
    role: 'user' | 'admin';
    phone: string | null;
    birthdate: string | null;
    postal_code: string | null;
    country: string;
    festivals_attended: number;
    festivals_attended_editions: string[];
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
  }

  let items = $state<UserRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let actingOn = $state<string | null>(null);
  let search = $state('');

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const { data, error } = await client.rpc('admin_list_users');
      if (error) throw error;
      items = (data ?? []) as UserRow[];
    } catch (err) {
      console.error('[admin/users] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
      items = [];
    } finally {
      loading = false;
    }
  }

  async function deleteUser(user: UserRow) {
    const client = auth.client;
    if (!client) return;
    const isMe = user.id === auth.user?.id;
    const isFounder = user.email.toLowerCase() === FOUNDER_EMAIL;
    if (isFounder) {
      alert('Founder-Account kann nicht gelöscht werden.');
      return;
    }
    if (isMe) {
      alert('Du kannst dich nicht selbst löschen.');
      return;
    }
    const c1 = confirm(
      `${user.display_name ?? user.email} ENDGÜLTIG löschen?\n\nAlle Posts, Likes, Follows und Feedback werden mitgelöscht. Nicht rückgängig.`,
    );
    if (!c1) return;
    const localPart = user.email.split('@')[0];
    const c2 = prompt(`Zur Sicherheit: Tippe "${localPart}" ein.`);
    if (c2 !== localPart) {
      alert('Falsch eingetippt — abgebrochen.');
      return;
    }
    actingOn = user.id;
    try {
      const { error } = await client.rpc('admin_delete_user', { target_user_id: user.id });
      if (error) throw error;
      items = items.filter((u) => u.id !== user.id);
    } catch (err) {
      console.error('[admin/users] delete failed', err);
      alert(`Löschen fehlgeschlagen: ${err instanceof Error ? err.message : 'unbekannt'}`);
    } finally {
      actingOn = null;
    }
  }

  async function setRole(user: UserRow, newRole: 'user' | 'admin') {
    const client = auth.client;
    if (!client) return;
    const isMe = user.id === auth.user?.id;
    const isFounder = user.email.toLowerCase() === FOUNDER_EMAIL;

    if (isFounder && newRole !== 'admin') {
      alert('Founder-Account kann nicht entzogen werden.');
      return;
    }
    const verb = newRole === 'admin' ? 'zum Admin machen' : 'die Admin-Rolle entziehen';
    if (!confirm(`${user.display_name ?? user.email}: wirklich ${verb}?`)) return;
    if (isMe && newRole !== 'admin') {
      if (!confirm('Du würdest dich SELBST entziehen — kein Admin-Zugang mehr ohne SQL. Sicher?'))
        return;
    }

    actingOn = user.id;
    try {
      const { error } = await client.rpc('admin_set_role', {
        target_user_id: user.id,
        new_role: newRole,
      });
      if (error) throw error;
      items = items.map((u) => (u.id === user.id ? { ...u, role: newRole } : u));
      if (isMe) await auth.checkAdmin();
    } catch (err) {
      console.error('[admin/users] setRole failed', err);
      alert(`Fehler: ${err instanceof Error ? err.message : 'unbekannt'}`);
    } finally {
      actingOn = null;
    }
  }

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });
  $effect(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.email, u.display_name ?? '', u.handle ?? '', u.postal_code ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  });

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  function fmtDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      User-Verwaltung
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      User
      <span class="text-fg-muted">/{items.length}</span>
    </h1>

    <input
      type="search"
      bind:value={search}
      placeholder="E-Mail, Name, Handle oder PLZ …"
      class="mt-6 w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none sm:max-w-md"
    />

    {#if loading}
      <p class="mt-10 text-fg-muted">…</p>
    {:else if errorMsg}
      <div class="mt-10 border-2 border-danger bg-surface p-5">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-danger"
        >
          Konnte User nicht laden
        </p>
        <p class="mt-2 font-mono text-xs text-fg-muted">{errorMsg}</p>
        <p class="mt-3 text-sm text-fg">
          Vermutlich fehlt Migration 0006 noch. Im Supabase-Dashboard:
          <code class="bg-bg px-2 py-1"
            >supabase/migrations/0006_user_fields_and_admin_rpcs.sql</code
          >
          ausführen.
        </p>
      </div>
    {:else if filtered.length === 0}
      <p class="mt-10 text-fg-muted">Keine Treffer.</p>
    {:else}
      <ul class="mt-8 space-y-3">
        {#each filtered as user (user.id)}
          {@const isFounder = user.email.toLowerCase() === FOUNDER_EMAIL}
          {@const isMe = user.id === auth.user?.id}
          <li class="border-2 border-border bg-surface p-4 md:p-5">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <!-- Identity + Meta -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-base font-black text-fg-inverse"
                  >
                    {(user.display_name ?? user.email).charAt(0).toUpperCase()}
                  </span>
                  <span
                    class="font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-lg"
                  >
                    {user.display_name ?? '(kein Name)'}
                  </span>
                  {#if user.handle}
                    <span class="font-mono text-xs text-fg-muted">@{user.handle}</span>
                  {/if}
                  {#if user.role === 'admin'}
                    <span
                      class="border-2 border-danger px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-danger"
                    >
                      ★ Admin
                    </span>
                  {/if}
                  {#if isFounder}
                    <span
                      class="border-2 border-accent bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-inverse"
                      title="Founder — geschützt"
                    >
                      Founder
                    </span>
                  {/if}
                  {#if isMe}
                    <span class="font-mono text-[10px] text-fg-muted">(du)</span>
                  {/if}
                </div>

                <dl
                  class="mt-3 grid gap-x-6 gap-y-1 font-mono text-xs text-fg-muted sm:grid-cols-2"
                >
                  <div class="contents">
                    <dt>E-Mail</dt>
                    <dd class="text-fg">
                      <a href={`mailto:${user.email}`} class="hover:text-accent">{user.email}</a>
                      {#if !user.email_confirmed_at}
                        <span class="ml-1 text-danger">⚠ unbestätigt</span>
                      {/if}
                    </dd>
                  </div>
                  <div class="contents">
                    <dt>Registriert</dt>
                    <dd class="text-fg">{fmtDate(user.created_at)}</dd>
                  </div>
                  <div class="contents">
                    <dt>Letzter Login</dt>
                    <dd class="text-fg">{fmtDateTime(user.last_sign_in_at)}</dd>
                  </div>
                  {#if user.phone}
                    <div class="contents">
                      <dt>Handy</dt>
                      <dd class="text-fg">
                        <a href={`tel:${user.phone}`} class="hover:text-accent">{user.phone}</a>
                      </dd>
                    </div>
                  {/if}
                  {#if user.birthdate}
                    <div class="contents">
                      <dt>Geburtstag</dt>
                      <dd class="text-fg">{fmtDate(user.birthdate)}</dd>
                    </div>
                  {/if}
                  {#if user.postal_code}
                    <div class="contents">
                      <dt>PLZ</dt>
                      <dd class="text-fg">{user.postal_code}</dd>
                    </div>
                  {/if}
                  <div class="contents">
                    <dt>Land</dt>
                    <dd class="text-fg">{user.country}</dd>
                  </div>
                  <div class="contents">
                    <dt>Editionen besucht</dt>
                    <dd class="text-fg">
                      {user.festivals_attended_editions?.length
                        ? user.festivals_attended_editions.join(', ')
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Actions -->
              <div class="flex shrink-0 flex-col gap-2 md:w-44">
                {#if user.role === 'user'}
                  <button
                    type="button"
                    onclick={() => setRole(user, 'admin')}
                    disabled={actingOn === user.id}
                    class="border-2 border-danger bg-danger px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg transition-all active:scale-95 disabled:opacity-50"
                  >
                    ★ Zum Admin machen
                  </button>
                {:else}
                  <button
                    type="button"
                    onclick={() => setRole(user, 'user')}
                    disabled={isFounder || actingOn === user.id}
                    class="border-2 border-border bg-bg px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-fg hover:text-fg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isFounder ? 'Founder ist geschützt' : ''}
                  >
                    {isFounder ? '🔒 Geschützt' : 'Admin entziehen'}
                  </button>
                {/if}
                <button
                  type="button"
                  onclick={() => auth.enterViewAs(user.id)}
                  disabled={actingOn === user.id || user.id === auth.user?.id}
                  class="border-2 border-border bg-bg px-3 py-2 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                  title={user.id === auth.user?.id
                    ? 'Das bist du selbst'
                    : 'App aus Sicht des Users anschauen'}
                >
                  👁 Als User sehen
                </button>
                <a
                  href={`/u/${user.id}`}
                  class="border-2 border-border bg-bg px-3 py-2 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-accent hover:text-accent"
                >
                  Profil öffnen →
                </a>
                <button
                  type="button"
                  onclick={() => deleteUser(user)}
                  disabled={isFounder || isMe || actingOn === user.id}
                  class="border-2 border-border bg-bg px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-danger hover:text-danger active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  title={isFounder
                    ? 'Founder ist geschützt'
                    : isMe
                      ? 'Du kannst dich nicht selbst löschen'
                      : 'Profil endgültig löschen'}
                >
                  🗑 Löschen
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
