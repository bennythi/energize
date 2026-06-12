<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  const EDITION = '2026';

  type ReturnAnswer = 'yes' | 'maybe' | 'no';

  let rating = $state<number>(0);
  let liked = $state('');
  let disliked = $state('');
  let improvements = $state('');
  let wouldReturn = $state<ReturnAnswer | ''>('');

  let loading = $state(true);
  let submitting = $state(false);
  let savedAt = $state<string | null>(null);
  let errorMsg = $state<string | null>(null);
  let existingId = $state<string | null>(null);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

  async function loadExisting() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) {
      loading = false;
      return;
    }
    try {
      const { data, error } = await client
        .from('feedback')
        .select('id, rating, liked, disliked, improvements, would_return, updated_at')
        .eq('user_id', user.id)
        .eq('edition', EDITION)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        existingId = data.id;
        rating = data.rating ?? 0;
        liked = data.liked ?? '';
        disliked = data.disliked ?? '';
        improvements = data.improvements ?? '';
        wouldReturn = (data.would_return ?? '') as ReturnAnswer | '';
        savedAt = data.updated_at;
      }
    } catch (err) {
      console.error('[feedback] load failed', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadExisting();
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;

    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;

    submitting = true;
    try {
      const payload = {
        user_id: user.id,
        edition: EDITION,
        rating: rating > 0 ? rating : null,
        liked: liked.trim() || null,
        disliked: disliked.trim() || null,
        improvements: improvements.trim() || null,
        would_return: wouldReturn || null,
      };
      const { data, error } = await client
        .from('feedback')
        .upsert(payload, { onConflict: 'user_id,edition' })
        .select('id, updated_at')
        .single();
      if (error) throw error;
      existingId = data.id;
      savedAt = data.updated_at;
    } catch (err) {
      console.error('[feedback] submit failed', err);
      errorMsg = m.feedback_error();
    } finally {
      submitting = false;
    }
  }

  const returnOptions: { value: ReturnAnswer; label: () => string }[] = [
    { value: 'yes', label: () => m.feedback_return_yes() },
    { value: 'maybe', label: () => m.feedback_return_maybe() },
    { value: 'no', label: () => m.feedback_return_no() },
  ];
</script>

<svelte:head>
  <title>{m.feedback_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>{m.feedback_title()}</Heading>
    <p class="mt-4 text-fg-muted">{m.feedback_lead()}</p>

    {#if loading}
      <p class="mt-8 text-sm text-fg-muted">…</p>
    {:else}
      {#if existingId}
        <p
          class="mt-6 border-l-4 border-accent bg-surface px-4 py-3 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
        >
          {m.feedback_existing_note()}
        </p>
      {/if}

      <form onsubmit={handleSubmit} class="mt-8 space-y-8">
        <fieldset>
          <legend
            class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >
            {m.feedback_rating_label()}
          </legend>
          <div class="mt-3 flex items-center gap-2" role="radiogroup">
            {#each [1, 2, 3, 4, 5] as star (star)}
              <button
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star}/5`}
                onclick={() => (rating = star)}
                class="
                  flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                  {rating >= star
                  ? 'border-accent bg-accent text-fg-inverse'
                  : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent'}
                "
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={rating >= star ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
              </button>
            {/each}
          </div>
          <p class="mt-2 text-xs text-fg-muted">{m.feedback_rating_hint()}</p>
        </fieldset>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.feedback_liked_label()}
          </span>
          <textarea
            bind:value={liked}
            placeholder={m.feedback_liked_placeholder()}
            rows="3"
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          ></textarea>
        </label>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.feedback_disliked_label()}
          </span>
          <textarea
            bind:value={disliked}
            placeholder={m.feedback_disliked_placeholder()}
            rows="3"
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          ></textarea>
        </label>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.feedback_improvements_label()}
          </span>
          <textarea
            bind:value={improvements}
            placeholder={m.feedback_improvements_placeholder()}
            rows="3"
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          ></textarea>
        </label>

        <fieldset>
          <legend
            class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >
            {m.feedback_would_return_label()}
          </legend>
          <div class="mt-3 flex flex-wrap gap-3" role="radiogroup">
            {#each returnOptions as opt (opt.value)}
              <button
                type="button"
                role="radio"
                aria-checked={wouldReturn === opt.value}
                onclick={() => (wouldReturn = opt.value)}
                class="
                  border-2 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] transition-all
                  {wouldReturn === opt.value
                  ? 'border-accent bg-accent text-fg-inverse'
                  : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent'}
                "
              >
                {opt.label()}
              </button>
            {/each}
          </div>
        </fieldset>

        {#if errorMsg}
          <p class="text-sm text-danger" role="alert">{errorMsg}</p>
        {/if}

        {#if savedAt && !submitting}
          <p
            class="border-l-4 border-success bg-surface px-4 py-3 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-success"
            aria-live="polite"
          >
            {m.feedback_thanks_title()} — {m.feedback_thanks_body()}
          </p>
        {/if}

        <Button type="submit" variant="yellow">
          {submitting
            ? m.feedback_submitting()
            : existingId
              ? m.feedback_update()
              : m.feedback_submit()}
        </Button>
      </form>
    {/if}
  </section>
</Container>
