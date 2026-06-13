<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';
  import { posts as wallPosts } from '$lib/posts.svelte';

  interface PendingPost {
    id: string;
    user_id: string;
    image_path: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
    author_email: string | null;
    author_display_name: string | null;
  }

  let filter = $state<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  let items = $state<PendingPost[]>([]);
  let loading = $state(true);
  let actingOn = $state<string | null>(null);

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    try {
      let query = client
        .from('posts')
        .select('id, user_id, image_path, caption, created_at, status')
        .order('created_at', { ascending: false })
        .limit(50);
      if (filter !== 'all') query = query.eq('status', filter);

      const { data: rows, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
      const { data: authors } = userIds.length
        ? await client.from('profiles').select('id, display_name').in('id', userIds)
        : { data: [] };
      const byUser = new Map(authors?.map((a) => [a.id, a]) ?? []);

      items = (rows ?? []).map((r) => ({
        ...r,
        image_url: wallPosts.publicUrl(r.image_path),
        author_email: null,
        author_display_name: byUser.get(r.user_id)?.display_name ?? null,
      }));
    } catch (err) {
      console.error('[admin/moderation] load failed', err);
      items = [];
    } finally {
      loading = false;
    }
  }

  async function setStatus(post: PendingPost, status: 'approved' | 'rejected') {
    const client = auth.client;
    if (!client) return;
    actingOn = post.id;
    try {
      const { error } = await client.from('posts').update({ status }).eq('id', post.id);
      if (error) throw error;
      // Optimistic: aus Liste entfernen wenn Filter es nicht mehr matcht
      if (filter !== 'all' && filter !== status) {
        items = items.filter((p) => p.id !== post.id);
      } else {
        items = items.map((p) => (p.id === post.id ? { ...p, status } : p));
      }
    } catch (err) {
      console.error('[admin/moderation] update failed', err);
      alert('Update fehlgeschlagen — siehe Console.');
    } finally {
      actingOn = null;
    }
  }

  async function deleteHard(post: PendingPost) {
    if (!confirm(`Foto endgültig löschen? Auch die Datei im Storage wird gelöscht.`)) return;
    const client = auth.client;
    if (!client) return;
    actingOn = post.id;
    try {
      // Storage-File zuerst, dann DB-Row (Cascade ist nicht aktiv)
      const { error: storageErr } = await client.storage.from('posts').remove([post.image_path]);
      if (storageErr) console.warn('[admin/moderation] storage remove failed', storageErr);

      const { error } = await client.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      items = items.filter((p) => p.id !== post.id);
    } catch (err) {
      console.error('[admin/moderation] delete failed', err);
      alert('Löschen fehlgeschlagen — siehe Console.');
    } finally {
      actingOn = null;
    }
  }

  $effect(() => {
    // Re-load wenn Filter wechselt — explizit tracken
    void filter;
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'pending', label: 'Wartend' },
    { value: 'approved', label: 'Freigegeben' },
    { value: 'rejected', label: 'Abgelehnt' },
    { value: 'all', label: 'Alle' },
  ];

  function formatDate(iso: string): string {
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
      Foto-Wall
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      Moderation
    </h1>

    <!-- Filter -->
    <ul class="mt-8 flex flex-wrap gap-2">
      {#each filters as f (f.value)}
        <li>
          <button
            type="button"
            onclick={() => (filter = f.value)}
            class="border-2 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] transition-colors"
            class:border-accent={filter === f.value}
            class:bg-accent={filter === f.value}
            class:text-fg-inverse={filter === f.value}
            class:border-border={filter !== f.value}
            class:text-fg-muted={filter !== f.value}
          >
            {f.label}
          </button>
        </li>
      {/each}
    </ul>

    {#if loading}
      <div class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i (i)}
          <div class="aspect-square animate-pulse bg-surface"></div>
        {/each}
      </div>
    {:else if items.length === 0}
      <div class="mt-10 border-l-4 border-accent bg-surface p-6">
        <p
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          {filter === 'pending' ? 'Keine offenen Posts.' : 'Keine Treffer.'}
        </p>
        <p class="mt-2 text-sm text-fg-muted">
          {filter === 'pending' ? 'Alle Posts sind abgearbeitet.' : 'Filter anders setzen.'}
        </p>
      </div>
    {:else}
      <ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each items as post (post.id)}
          <li class="flex flex-col border-2 border-border bg-surface">
            <div class="relative aspect-square overflow-hidden bg-bg">
              <img
                src={post.image_url}
                alt={post.caption ?? ''}
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <span
                class="absolute left-2 top-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                class:bg-accent={post.status === 'approved'}
                class:text-fg-inverse={post.status === 'approved' || post.status === 'rejected'}
                class:bg-fg-muted={post.status === 'pending'}
                class:bg-danger={post.status === 'rejected'}
              >
                {post.status}
              </span>
            </div>

            <div class="flex flex-1 flex-col gap-3 p-4">
              <div>
                <p
                  class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {formatDate(post.created_at)} · {post.author_display_name ?? 'Anonym'}
                </p>
                {#if post.caption}
                  <p class="mt-2 text-sm text-fg">{post.caption}</p>
                {/if}
                <p
                  class="mt-2 truncate font-mono text-[10px] text-fg-muted opacity-60"
                  title={post.image_path}
                >
                  {post.image_path}
                </p>
              </div>

              <div class="mt-auto flex flex-wrap gap-2">
                {#if post.status !== 'approved'}
                  <button
                    type="button"
                    onclick={() => setStatus(post, 'approved')}
                    disabled={actingOn === post.id}
                    class="flex-1 border-2 border-success bg-success px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse transition-all active:scale-95 disabled:opacity-50"
                  >
                    ✓ Freigeben
                  </button>
                {/if}
                {#if post.status !== 'rejected'}
                  <button
                    type="button"
                    onclick={() => setStatus(post, 'rejected')}
                    disabled={actingOn === post.id}
                    class="flex-1 border-2 border-danger bg-bg px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-danger transition-all hover:bg-danger hover:text-fg active:scale-95 disabled:opacity-50"
                  >
                    ✕ Ablehnen
                  </button>
                {/if}
                <button
                  type="button"
                  onclick={() => deleteHard(post)}
                  disabled={actingOn === post.id}
                  class="border-2 border-border bg-bg px-3 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-danger hover:text-danger active:scale-95 disabled:opacity-50"
                  title="Endgültig löschen (Storage + DB)"
                >
                  🗑
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>

      <p
        class="mt-6 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {items.length} Posts gezeigt (max. 50)
      </p>
    {/if}
  </section>
</Container>
