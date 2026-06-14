<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface FeedbackRow {
    id: string;
    user_id: string;
    edition: string;
    rating: number | null;
    liked: string | null;
    disliked: string | null;
    improvements: string | null;
    would_return: 'yes' | 'maybe' | 'no' | null;
    created_at: string;
    author_name: string | null;
  }

  let edition = $state('2026');
  let items = $state<FeedbackRow[]>([]);
  let loading = $state(true);

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    try {
      const { data: rows, error } = await client
        .from('feedback')
        .select(
          'id, user_id, edition, rating, liked, disliked, improvements, would_return, created_at',
        )
        .eq('edition', edition)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
      const { data: authors } = userIds.length
        ? await client.from('profiles_public').select('id, display_name').in('id', userIds)
        : { data: [] };
      const byUser = new Map(authors?.map((a) => [a.id, a]) ?? []);

      items = (rows ?? []).map((r) => ({
        ...r,
        author_name: byUser.get(r.user_id)?.display_name ?? null,
      }));
    } catch (err) {
      console.error('[admin/feedback] load failed', err);
      items = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void edition;
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  // Aggregat-Statistiken
  const stats = $derived.by(() => {
    const total = items.length;
    if (total === 0) return null;

    const ratings = items.map((i) => i.rating).filter((r): r is number => r !== null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    const returns = items
      .map((i) => i.would_return)
      .filter((r): r is 'yes' | 'maybe' | 'no' => r !== null);
    const yes = returns.filter((r) => r === 'yes').length;
    const maybe = returns.filter((r) => r === 'maybe').length;
    const no = returns.filter((r) => r === 'no').length;

    return {
      total,
      avgRating: avg ? avg.toFixed(2) : '—',
      ratingsCount: ratings.length,
      yes,
      maybe,
      no,
      returnsCount: returns.length,
      yesPct: returns.length ? Math.round((yes / returns.length) * 100) : 0,
      maybePct: returns.length ? Math.round((maybe / returns.length) * 100) : 0,
      noPct: returns.length ? Math.round((no / returns.length) * 100) : 0,
    };
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      Auswertung
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      Feedback {edition}
    </h1>

    <!-- Edition-Filter -->
    <div class="mt-6 flex flex-wrap gap-2">
      {#each ['2026', '2027'] as e (e)}
        <button
          type="button"
          onclick={() => (edition = e)}
          class="border-2 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)]"
          class:border-accent={edition === e}
          class:bg-accent={edition === e}
          class:text-fg-inverse={edition === e}
          class:border-border={edition !== e}
          class:text-fg-muted={edition !== e}
        >
          {e}
        </button>
      {/each}
    </div>

    {#if loading}
      <p class="mt-10 text-fg-muted">…</p>
    {:else if !stats}
      <div class="mt-10 border-l-4 border-border bg-surface p-6">
        <p
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Keine Einsendungen für {edition}.
        </p>
      </div>
    {:else}
      <!-- Aggregate-Tiles -->
      <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="border-2 border-accent bg-surface p-5">
          <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Einsendungen
          </p>
          <p
            class="mt-2 font-display font-black tabular-nums leading-none text-accent"
            style="font-size: clamp(2rem, 4vw, 3rem);"
          >
            {stats.total}
          </p>
        </div>
        <div class="border-2 border-border bg-surface p-5">
          <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            ⌀ Bewertung
          </p>
          <p
            class="mt-2 font-display font-black tabular-nums leading-none text-fg"
            style="font-size: clamp(2rem, 4vw, 3rem);"
          >
            {stats.avgRating}<span class="text-fg-muted">/5</span>
          </p>
          <p class="mt-1 font-mono text-[10px] text-fg-muted">{stats.ratingsCount} Bewertungen</p>
        </div>
        <div class="border-2 border-success bg-surface p-5">
          <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Würden wiederkommen
          </p>
          <p
            class="mt-2 font-display font-black tabular-nums leading-none text-success"
            style="font-size: clamp(2rem, 4vw, 3rem);"
          >
            {stats.yesPct}<span class="text-fg-muted">%</span>
          </p>
          <p class="mt-1 font-mono text-[10px] text-fg-muted">
            {stats.yes} ja · {stats.maybe} vielleicht · {stats.no} nein
          </p>
        </div>
        <div class="border-2 border-border bg-surface p-5">
          <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Antwortquote
          </p>
          <p
            class="mt-2 font-display font-black tabular-nums leading-none text-fg"
            style="font-size: clamp(2rem, 4vw, 3rem);"
          >
            {stats.returnsCount}
          </p>
          <p class="mt-1 font-mono text-[10px] text-fg-muted">
            von {stats.total} mit Würde-wiederkommen
          </p>
        </div>
      </div>

      <!-- Einzel-Einsendungen -->
      <h2
        class="mt-16 font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        style="font-size: clamp(1.5rem, 3.5vw, 2.5rem);"
      >
        Alle Antworten
      </h2>

      <ul class="mt-6 space-y-4">
        {#each items as fb (fb.id)}
          <li class="border-2 border-border bg-surface p-5">
            <div class="flex flex-wrap items-center gap-3">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {fb.author_name ?? 'Anonym'} · {formatDate(fb.created_at)}
              </p>
              {#if fb.rating}
                <span
                  class="border-2 border-accent bg-accent px-2 py-0.5 font-mono text-[10px] text-fg-inverse"
                >
                  ⭐ {fb.rating}/5
                </span>
              {/if}
              {#if fb.would_return}
                <span
                  class="border-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                  class:border-success={fb.would_return === 'yes'}
                  class:text-success={fb.would_return === 'yes'}
                  class:border-fg-muted={fb.would_return === 'maybe'}
                  class:text-fg-muted={fb.would_return === 'maybe' || fb.would_return === 'no'}
                  class:border-danger={fb.would_return === 'no'}
                >
                  {fb.would_return === 'yes'
                    ? 'Kommt wieder'
                    : fb.would_return === 'maybe'
                      ? 'Vielleicht'
                      : 'Eher nicht'}
                </span>
              {/if}
            </div>

            <dl class="mt-4 grid gap-4 md:grid-cols-3">
              {#if fb.liked}
                <div>
                  <dt
                    class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-success"
                  >
                    + Was war gut
                  </dt>
                  <dd class="mt-1 text-sm leading-relaxed text-fg">{fb.liked}</dd>
                </div>
              {/if}
              {#if fb.disliked}
                <div>
                  <dt
                    class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-danger"
                  >
                    − Was war schlecht
                  </dt>
                  <dd class="mt-1 text-sm leading-relaxed text-fg">{fb.disliked}</dd>
                </div>
              {/if}
              {#if fb.improvements}
                <div>
                  <dt
                    class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
                  >
                    → Verbessern
                  </dt>
                  <dd class="mt-1 text-sm leading-relaxed text-fg">{fb.improvements}</dd>
                </div>
              {/if}
            </dl>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
