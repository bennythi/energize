<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  interface PostRow {
    id: string;
    image_path: string;
    caption: string | null;
    created_at: string;
    user_id: string;
  }

  let posts = $state<PostRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  async function loadPosts() {
    const client = auth.client;
    if (!client) {
      loading = false;
      return;
    }
    try {
      const { data, error } = await client
        .from('posts')
        .select('id, image_path, caption, created_at, user_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      posts = data ?? [];
    } catch (err) {
      console.error('[wall] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (auth.initialized) void loadPosts();
  });

  onMount(() => {
    void loadPosts();
  });
</script>

<svelte:head>
  <title>Foto-Wall — ENERGIZE</title>
</svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <Container>
    <div class="relative py-16 md:py-24">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Community
      </p>
      <h1
        class="mt-4 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 8vw, 5rem);"
      >
        Foto-Wall
      </h1>
      <p class="mt-4 max-w-2xl text-sm text-fg-muted md:text-base">
        Eure besten Momente vom Festival. Alle Posts werden vorab moderiert — kein Bot-Spam, kein
        Trash.
      </p>

      {#if auth.user}
        <div class="mt-8">
          <Button href="/wall/upload" variant="yellow">Foto hochladen</Button>
        </div>
      {:else if isAuthConfigured}
        <div class="mt-8">
          <Button href="/login" variant="yellow">Login zum Hochladen</Button>
        </div>
      {/if}
    </div>
  </Container>
</section>

<!-- CONTENT -->
<Container>
  <section class="py-12 md:py-16">
    {#if !isAuthConfigured}
      <p class="text-fg-muted">Wall ist bald für alle sichtbar.</p>
    {:else if loading}
      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        {#each Array(8) as _, i (i)}
          <div class="aspect-square animate-pulse bg-surface"></div>
        {/each}
      </div>
    {:else if errorMsg}
      <div class="border-2 border-danger bg-surface p-6">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-danger"
        >
          Wall konnte nicht geladen werden
        </p>
        <p class="mt-2 font-mono text-xs text-fg-muted">{errorMsg}</p>
      </div>
    {:else if posts.length === 0}
      <!-- Empty-State -->
      <div class="border-2 border-fg bg-accent p-8 text-fg-inverse md:p-12">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse/70">
          Noch leer
        </p>
        <p
          class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
          style="font-size: clamp(2rem, 6vw, 3.5rem);"
        >
          Sei der erste.
        </p>
        <p class="mt-4 max-w-lg text-sm md:text-base">
          Beim Festival 2027 startet die Wall. Bis dahin: Account anlegen, Favoriten markieren — und
          nach dem Festival deine besten Shots posten.
        </p>
      </div>
    {:else}
      <ul class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {#each posts as post (post.id)}
          <li class="group relative aspect-square overflow-hidden border-2 border-border">
            <img
              src={post.image_path}
              alt={post.caption ?? 'Foto-Wall-Beitrag'}
              loading="lazy"
              class="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {#if post.caption}
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/60 to-transparent p-3"
              >
                <p class="font-mono text-xs text-fg">{post.caption}</p>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
