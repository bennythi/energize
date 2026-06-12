<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { posts } from '$lib/posts.svelte';
  import PostCard from '$lib/PostCard.svelte';

  $effect(() => {
    if (auth.initialized) void posts.load();
  });

  onMount(() => {
    void posts.load();
  });
</script>

<svelte:head>
  <title>{m.wall_title()} — ENERGIZE</title>
</svelte:head>

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
        {m.wall_title()}
      </h1>
      <p class="mt-4 max-w-2xl text-sm text-fg-muted md:text-base">{m.wall_lead()}</p>

      <div class="mt-8 flex flex-wrap gap-3">
        {#if auth.user}
          <Button href="/wall/upload" variant="yellow">{m.wall_upload_cta()}</Button>
          <Button href="/community/users" variant="ghost">Andere finden →</Button>
        {:else if isAuthConfigured}
          <Button href="/login" variant="yellow">{m.wall_login_cta()}</Button>
        {/if}
      </div>
    </div>
  </Container>
</section>

<Container>
  <section class="py-12 md:py-16">
    {#if !isAuthConfigured}
      <p class="text-fg-muted">Wall ist bald für alle sichtbar.</p>
    {:else if !posts.initialized || posts.loading}
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {#each Array(8) as _, i (i)}
          <div class="aspect-square animate-pulse bg-surface"></div>
        {/each}
      </div>
    {:else if posts.errorMsg}
      <div class="border-2 border-danger bg-surface p-6">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-danger"
        >
          Wall konnte nicht geladen werden
        </p>
        <p class="mt-2 font-mono text-xs text-fg-muted">{posts.errorMsg}</p>
      </div>
    {:else if posts.items.length === 0}
      <div class="border-2 border-fg bg-accent p-8 text-fg-inverse md:p-12">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse/70">
          {m.wall_empty_eyebrow()}
        </p>
        <p
          class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
          style="font-size: clamp(2rem, 6vw, 3.5rem);"
        >
          {m.wall_empty_title()}
        </p>
        <p class="mt-4 max-w-lg text-sm md:text-base">{m.wall_empty_body()}</p>
        {#if auth.user}
          <div class="mt-6">
            <a
              href="/wall/upload"
              class="inline-flex items-center justify-center border-2 border-fg-inverse bg-fg-inverse px-6 py-3 font-display text-sm font-black uppercase tracking-[var(--tracking-claim)] text-accent"
            >
              {m.wall_upload_cta()}
            </a>
          </div>
        {/if}
      </div>
    {:else}
      <ul class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {#each posts.items as post (post.id)}
          <li>
            <PostCard {post} />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
