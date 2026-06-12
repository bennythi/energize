<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from './auth.svelte';
  import { posts, type WallPost } from './posts.svelte';

  interface Props {
    post: WallPost;
  }

  let { post }: Props = $props();

  let showReport = $state(false);
  let reportReason = $state('');
  let reportSubmitting = $state(false);
  let reported = $state(false);

  const imageUrl = $derived(posts.publicUrl(post.image_path));
  const profileHref = $derived(`/u/${post.user_id}`);
  const authorName = $derived(post.author_display_name ?? 'Anonym');

  async function handleLike(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!auth.user) {
      await goto('/login');
      return;
    }
    await posts.toggleLike(post.id);
  }

  async function submitReport(event: SubmitEvent) {
    event.preventDefault();
    if (!reportReason.trim()) return;
    reportSubmitting = true;
    const ok = await posts.report(post.id, reportReason.trim());
    reportSubmitting = false;
    reported = ok;
    if (ok) {
      reportReason = '';
      setTimeout(() => (showReport = false), 1500);
    }
  }
</script>

<article class="border-2 border-border bg-surface">
  <!-- IMAGE -->
  <div class="relative aspect-square overflow-hidden">
    <img
      src={imageUrl}
      alt={post.caption ?? 'Foto-Wall'}
      loading="lazy"
      class="h-full w-full object-cover"
    />
    <button
      type="button"
      onclick={() => (showReport = !showReport)}
      aria-label="Melden"
      class="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border-2 border-fg-muted bg-bg/60 backdrop-blur font-mono text-xs text-fg-muted transition-colors hover:border-danger hover:text-danger"
    >
      !
    </button>
  </div>

  <!-- META -->
  <div class="flex items-center justify-between gap-2 p-3">
    <a
      href={profileHref}
      class="flex min-w-0 flex-1 items-center gap-2 transition-colors hover:text-accent"
    >
      <span
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-black text-fg-inverse"
      >
        {authorName.charAt(0).toUpperCase()}
      </span>
      <span class="truncate font-mono text-xs text-fg">{authorName}</span>
    </a>

    <button
      type="button"
      onclick={handleLike}
      aria-pressed={post.liked_by_me}
      class="inline-flex items-center gap-1 border-2 px-2 py-1 font-mono text-xs transition-all
        {post.liked_by_me
        ? 'border-accent bg-accent text-fg-inverse'
        : 'border-border bg-bg text-fg-muted hover:border-accent hover:text-accent'}"
    >
      <span aria-hidden="true">♥</span>
      <span class="tabular-nums">{post.like_count}</span>
    </button>
  </div>

  {#if post.caption}
    <p class="border-t border-border px-3 py-2 text-xs text-fg-muted">{post.caption}</p>
  {/if}

  {#if showReport}
    <form onsubmit={submitReport} class="border-t border-danger bg-bg p-3">
      <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-danger">
        Beitrag melden
      </p>
      {#if reported}
        <p class="mt-2 text-xs text-success">✓ Danke, wir schauen uns das an.</p>
      {:else}
        <textarea
          bind:value={reportReason}
          rows="2"
          placeholder="Warum sollten wir das prüfen?"
          maxlength="200"
          disabled={reportSubmitting}
          class="mt-2 w-full border-2 border-border bg-surface px-2 py-1 font-mono text-xs text-fg placeholder:text-fg-muted focus:border-danger focus:outline-none disabled:opacity-50"
        ></textarea>
        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onclick={() => (showReport = false)}
            class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-fg"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={reportSubmitting || !reportReason.trim()}
            class="border-2 border-danger bg-danger px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg disabled:opacity-50"
          >
            {reportSubmitting ? '…' : 'Melden'}
          </button>
        </div>
      {/if}
    </form>
  {/if}
</article>
