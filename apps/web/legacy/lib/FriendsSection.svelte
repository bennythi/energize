<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { avatarUrl } from '$lib/avatarUrl';

  interface PendingRow {
    friendship_id: string;
    requester_id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
    requested_at: string;
  }

  interface FriendRow {
    friendship_id: string;
    friend_id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
    since: string | null;
  }

  interface SearchHit {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
  }

  let pending = $state<PendingRow[]>([]);
  let friends = $state<FriendRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state<string | null>(null);

  let query = $state('');
  let searchResults = $state<SearchHit[]>([]);
  let searching = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const [pendRes, friendsRes] = await Promise.all([
        client.rpc('friends_my_pending'),
        client.rpc('friends_my_list'),
      ]);
      if (pendRes.error) throw pendRes.error;
      if (friendsRes.error) throw friendsRes.error;
      pending = (pendRes.data ?? []) as PendingRow[];
      friends = (friendsRes.data ?? []) as FriendRow[];
    } catch (err) {
      console.error('[friends] load failed', err);
      errorMsg = 'Konnte Freunde nicht laden. Migration 0020 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function safeTerm(raw: string): string {
    return raw
      .replace(/[,()*%]/g, '')
      .trim()
      .slice(0, 60);
  }

  async function search(term: string) {
    const client = auth.client;
    if (!client) return;
    const safe = safeTerm(term);
    if (!safe) {
      searchResults = [];
      return;
    }
    searching = true;
    try {
      const pattern = `%${safe}%`;
      const { data, error } = await client
        .from('profiles_public')
        .select('id, display_name, handle, avatar_path')
        .or(`display_name.ilike.${pattern},handle.ilike.${pattern}`)
        .neq('id', auth.user?.id ?? '')
        .limit(8);
      if (error) throw error;
      const friendIds = new Set(friends.map((f) => f.friend_id));
      const pendingIds = new Set(pending.map((p) => p.requester_id));
      searchResults = ((data ?? []) as SearchHit[]).filter(
        (r) => !friendIds.has(r.id) && !pendingIds.has(r.id),
      );
    } catch (err) {
      console.error('[friends] search failed', err);
    } finally {
      searching = false;
    }
  }

  function onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    query = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(value), 250);
  }

  async function sendRequest(targetId: string) {
    const client = auth.client;
    if (!client) return;
    acting = targetId;
    errorMsg = null;
    try {
      const { data, error } = await client.rpc('friend_request_send', {
        target_user_id: targetId,
      });
      if (error) throw error;
      query = '';
      searchResults = [];
      await load();
      const msg = data?.[0]?.message;
      if (msg === 'auto_accept_reciprocal') {
        alert('Ihr seid jetzt Freunde, weil die Gegenseite dich auch angefragt hatte.');
      }
    } catch (err) {
      console.error('[friends] send failed', err);
      errorMsg = err instanceof Error ? err.message : 'Anfrage fehlgeschlagen';
    } finally {
      acting = null;
    }
  }

  async function respond(friendshipId: string, accept: boolean) {
    const client = auth.client;
    if (!client) return;
    acting = friendshipId;
    errorMsg = null;
    try {
      const { error } = await client.rpc('friend_request_respond', {
        request_id: friendshipId,
        accept,
      });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[friends] respond failed', err);
      errorMsg = err instanceof Error ? err.message : 'Antwort fehlgeschlagen';
    } finally {
      acting = null;
    }
  }

  async function removeFriend(friendId: string, name: string) {
    if (!confirm(`Freundschaft mit ${name} wirklich beenden?`)) return;
    const client = auth.client;
    if (!client) return;
    acting = friendId;
    try {
      const { error } = await client.rpc('friend_remove', { other_user_id: friendId });
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('[friends] remove failed', err);
    } finally {
      acting = null;
    }
  }

  function label(row: { display_name: string | null; handle: string | null }): string {
    return row.display_name || (row.handle ? '@' + row.handle : 'Energizer');
  }

  onMount(() => {
    void load();
  });
</script>

<section class="space-y-8">
  {#if errorMsg}
    <p class="border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
      {errorMsg}
    </p>
  {/if}

  <!-- Suche -->
  <div>
    <h3
      class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
    >
      Freunde finden
    </h3>
    <p class="mt-1 text-xs text-fg-muted">
      Such nach Anzeigename oder Handle. Anfrage wird per Mail an die Gegenseite geschickt.
    </p>
    <input
      type="search"
      bind:value={query}
      oninput={onInput}
      placeholder="z. B. @benny oder Name"
      maxlength="60"
      class="mt-3 w-full border-2 border-border bg-bg px-4 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
    />
    {#if searching}
      <p class="mt-2 font-mono text-xs text-fg-muted">Suche ...</p>
    {:else if searchResults.length > 0}
      <ul class="mt-3 divide-y divide-border border-y border-border">
        {#each searchResults as hit (hit.id)}
          <li class="flex items-center justify-between gap-3 p-3">
            <div class="flex items-center gap-3">
              {#if avatarUrl(hit.avatar_path)}
                <img
                  src={avatarUrl(hit.avatar_path)}
                  alt=""
                  class="h-10 w-10 border border-border object-cover"
                />
              {:else}
                <div
                  class="flex h-10 w-10 items-center justify-center border border-border bg-surface font-display text-base font-black text-fg-muted"
                >
                  ?
                </div>
              {/if}
              <div class="min-w-0">
                <p class="truncate font-mono text-sm text-fg">{label(hit)}</p>
                {#if hit.handle}
                  <p class="font-mono text-[10px] text-fg-muted">@{hit.handle}</p>
                {/if}
              </div>
            </div>
            <Button
              variant="ghost"
              onclick={() => sendRequest(hit.id)}
              disabled={acting === hit.id}
            >
              {acting === hit.id ? '...' : 'Anfragen'}
            </Button>
          </li>
        {/each}
      </ul>
    {:else if query.trim()}
      <p class="mt-2 text-sm text-fg-muted">Niemand gefunden.</p>
    {/if}
  </div>

  {#if loading}
    <p class="text-fg-muted">Lade ...</p>
  {:else}
    <!-- Pending -->
    {#if pending.length > 0}
      <div>
        <h3
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          Offene Anfragen ({pending.length})
        </h3>
        <ul class="mt-3 divide-y divide-border border-y border-border">
          {#each pending as p (p.friendship_id)}
            <li class="flex items-center justify-between gap-3 p-3">
              <div class="flex items-center gap-3">
                {#if avatarUrl(p.avatar_path)}
                  <img
                    src={avatarUrl(p.avatar_path)}
                    alt=""
                    class="h-10 w-10 border border-border object-cover"
                  />
                {:else}
                  <div
                    class="flex h-10 w-10 items-center justify-center border border-border bg-surface font-display text-base font-black text-fg-muted"
                  >
                    ?
                  </div>
                {/if}
                <div class="min-w-0">
                  <p class="truncate font-mono text-sm text-fg">{label(p)}</p>
                  {#if p.handle}
                    <p class="font-mono text-[10px] text-fg-muted">@{p.handle}</p>
                  {/if}
                </div>
              </div>
              <div class="flex shrink-0 gap-2">
                <Button
                  variant="yellow"
                  onclick={() => respond(p.friendship_id, true)}
                  disabled={acting === p.friendship_id}
                >
                  Annehmen
                </Button>
                <button
                  onclick={() => respond(p.friendship_id, false)}
                  disabled={acting === p.friendship_id}
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)] disabled:opacity-50"
                >
                  Ablehnen
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Freunde -->
    <div>
      <h3
        class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        Freunde ({friends.length})
      </h3>
      {#if friends.length === 0}
        <p class="mt-2 text-sm text-fg-muted">
          Noch keine Freunde verbunden. Such oben nach einem Energizer und schick eine Anfrage.
        </p>
      {:else}
        <ul class="mt-3 divide-y divide-border border-y border-border">
          {#each friends as f (f.friendship_id)}
            <li class="flex items-center justify-between gap-3 p-3">
              <a
                href={`/u/${f.friend_id}`}
                class="flex min-w-0 items-center gap-3 hover:opacity-80"
              >
                {#if avatarUrl(f.avatar_path)}
                  <img
                    src={avatarUrl(f.avatar_path)}
                    alt=""
                    class="h-10 w-10 border border-border object-cover"
                  />
                {:else}
                  <div
                    class="flex h-10 w-10 items-center justify-center border border-border bg-surface font-display text-base font-black text-fg-muted"
                  >
                    ?
                  </div>
                {/if}
                <div class="min-w-0">
                  <p class="truncate font-mono text-sm text-fg">{label(f)}</p>
                  {#if f.handle}
                    <p class="font-mono text-[10px] text-fg-muted">@{f.handle}</p>
                  {/if}
                </div>
              </a>
              <button
                onclick={() => removeFriend(f.friend_id, label(f))}
                disabled={acting === f.friend_id}
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)] disabled:opacity-50"
              >
                entfernen
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>
