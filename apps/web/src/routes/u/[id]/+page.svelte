<script lang="ts">
  import { page } from '$app/state';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';
  import { posts as postsStore } from '$lib/posts.svelte';
  import { avatarUrl } from '$lib/avatarUrl';

  interface ProfileRow {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
    created_at: string;
  }

  interface ProfilePost {
    id: string;
    image_path: string;
    caption: string | null;
    created_at: string;
  }

  const userId = $derived(page.params.id);

  let profile = $state<ProfileRow | null>(null);
  let userPosts = $state<ProfilePost[]>([]);
  let followerCount = $state(0);
  let followingCount = $state(0);
  let imFollowing = $state(false);

  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let toggling = $state(false);

  const isMe = $derived(auth.user?.id === userId);

  async function load() {
    const client = auth.client;
    if (!client || !userId) {
      loading = false;
      return;
    }
    loading = true;
    errorMsg = null;
    try {
      const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
        client
          .from('profiles_public')
          .select('id, display_name, handle, avatar_path, created_at')
          .eq('id', userId)
          .maybeSingle(),
        client
          .from('posts')
          .select('id, image_path, caption, created_at')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(60),
        client
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followee_id', userId),
        client
          .from('follows')
          .select('followee_id', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      if (profileRes.error) throw profileRes.error;
      profile = profileRes.data;
      userPosts = postsRes.data ?? [];
      followerCount = followersRes.count ?? 0;
      followingCount = followingRes.count ?? 0;

      // Bin ich Follower?
      if (auth.user && auth.user.id !== userId) {
        const { data: f } = await client
          .from('follows')
          .select('follower_id')
          .eq('follower_id', auth.user.id)
          .eq('followee_id', userId)
          .maybeSingle();
        imFollowing = !!f;
      }
    } catch (err) {
      console.error('[profile] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  // load() ist guarded — kein doppel-Aufruf noetig.
  $effect(() => {
    if (auth.initialized && userId) void load();
  });

  async function toggleFollow() {
    const client = auth.client;
    const me = auth.user;
    if (!client || !me || !userId) return;
    toggling = true;
    const wasFollowing = imFollowing;
    imFollowing = !wasFollowing;
    followerCount += wasFollowing ? -1 : 1;
    try {
      if (wasFollowing) {
        const { error } = await client
          .from('follows')
          .delete()
          .eq('follower_id', me.id)
          .eq('followee_id', userId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('follows')
          .insert({ follower_id: me.id, followee_id: userId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[profile] follow toggle failed', err);
      imFollowing = wasFollowing;
      followerCount += wasFollowing ? 1 : -1;
    } finally {
      toggling = false;
    }
  }

  function publicImageUrl(image_path: string): string {
    return postsStore.publicUrl(image_path);
  }

  const displayName = $derived(profile?.display_name ?? profile?.handle ?? 'Anonym');
  const initial = $derived(displayName.charAt(0).toUpperCase());
</script>

<svelte:head>
  <title>{displayName} — ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container size="md">
    <div class="py-16 md:py-20">
      {#if loading}
        <p class="text-fg-muted">…</p>
      {:else if errorMsg}
        <p class="text-danger">{errorMsg}</p>
      {:else if !profile}
        <p class="text-fg-muted">User nicht gefunden.</p>
      {:else}
        <div class="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {#if avatarUrl(profile.avatar_path)}
            <img
              src={avatarUrl(profile.avatar_path)}
              alt=""
              class="h-24 w-24 shrink-0 border-2 border-fg object-cover"
            />
          {:else}
            <div
              class="flex h-24 w-24 shrink-0 items-center justify-center bg-accent font-display text-4xl font-black text-fg-inverse"
            >
              {initial}
            </div>
          {/if}

          <div class="flex-1">
            <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
              {profile.handle ? `@${profile.handle}` : 'Profil'}
            </p>
            <h1
              class="mt-1 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
              style="font-size: clamp(2rem, 6vw, 3.5rem);"
            >
              {displayName}
            </h1>

            <div class="mt-4 flex flex-wrap gap-6 font-mono text-sm text-fg-muted">
              <span>
                <span class="font-black tabular-nums text-fg">{userPosts.length}</span> Posts
              </span>
              <span>
                <span class="font-black tabular-nums text-fg">{followerCount}</span> Follower
              </span>
              <span>
                <span class="font-black tabular-nums text-fg">{followingCount}</span> Folgt
              </span>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              {#if isMe}
                <Button href="/account" variant="ghost">Profil bearbeiten</Button>
              {:else if auth.user}
                <Button onclick={toggleFollow} variant={imFollowing ? 'ghost' : 'yellow'}>
                  {toggling ? '…' : imFollowing ? 'Entfolgen' : 'Folgen'}
                </Button>
              {:else}
                <Button href="/login" variant="yellow">Login zum Folgen</Button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </Container>
</section>

<Container size="md">
  <section class="py-12">
    {#if userPosts.length > 0}
      <h2
        class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      >
        Foto-Wall
      </h2>
      <ul class="mt-6 grid grid-cols-3 gap-2 md:grid-cols-4">
        {#each userPosts as post (post.id)}
          <li class="relative aspect-square overflow-hidden border-2 border-border">
            <img
              src={publicImageUrl(post.image_path)}
              alt={post.caption ?? ''}
              loading="lazy"
              class="h-full w-full object-cover"
            />
          </li>
        {/each}
      </ul>
    {:else if !loading && profile}
      <p
        class="border-l-4 border-border pl-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {isMe ? 'Du hast noch nichts gepostet.' : 'Hat noch nichts gepostet.'}
      </p>
    {/if}
  </section>
</Container>
