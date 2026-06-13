<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface ProfileSearchRow {
    id: string;
    display_name: string | null;
    handle: string | null;
  }

  let query = $state('');
  let results = $state<ProfileSearchRow[]>([]);
  let recent = $state<ProfileSearchRow[]>([]);
  let loading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function loadRecent() {
    const client = auth.client;
    if (!client) return;
    try {
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, handle')
        .not('display_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(24);
      if (error) throw error;
      recent = data ?? [];
    } catch (err) {
      console.error('[users] recent load failed', err);
    }
  }

  /**
   * Sicherheits-Filter für PostgREST-Filter-Strings.
   * Komma, Klammern und Stern brechen aus dem `.or(...)`-Pattern aus
   * und können die WHERE-Clause umschreiben. Wir entfernen sie hart,
   * statt sie zu escapen (PostgREST hat keinen Escape-Mechanismus).
   */
  function safeSearchTerm(raw: string): string {
    return raw
      .replace(/[,()*%]/g, '')
      .trim()
      .slice(0, 60);
  }

  async function runSearch(term: string) {
    const client = auth.client;
    if (!client) return;
    const safe = safeSearchTerm(term);
    if (!safe) {
      results = [];
      return;
    }
    loading = true;
    try {
      const pattern = `%${safe}%`;
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, handle')
        .or(`display_name.ilike.${pattern},handle.ilike.${pattern}`)
        .limit(30);
      if (error) throw error;
      results = data ?? [];
    } catch (err) {
      console.error('[users] search failed', err);
      results = [];
    } finally {
      loading = false;
    }
  }

  function onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    query = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(value), 250);
  }

  $effect(() => {
    if (auth.initialized) void loadRecent();
  });

  onMount(() => {
    void loadRecent();
  });

  const visible = $derived(query.trim().length > 0 ? results : recent);
  const heading = $derived(query.trim().length > 0 ? 'Treffer' : 'Neu im Account');
</script>

<svelte:head>
  <title>Community — ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container size="md">
    <div class="py-16 md:py-20">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Community
      </p>
      <h1
        class="mt-4 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 4rem);"
      >
        Andere Energizer
      </h1>
      <p class="mt-4 max-w-xl text-sm text-fg-muted md:text-base">
        Folge deinen Bekannten, sieh ihre Posts auf der Wall, plan euer Festival zusammen.
      </p>

      <div class="mt-8">
        <input
          type="search"
          autocomplete="off"
          placeholder="Name oder @handle suchen …"
          bind:value={query}
          oninput={onInput}
          class="w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  </Container>
</section>

<Container size="md">
  <section class="py-12 md:py-16">
    <h2 class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      {heading}{loading ? ' …' : ''}
    </h2>

    {#if visible.length === 0}
      <p class="mt-4 text-sm text-fg-muted">
        {query.trim().length > 0
          ? 'Niemand passt zur Suche.'
          : 'Noch keine Profile mit Display-Name.'}
      </p>
    {:else}
      <ul class="mt-6 divide-y divide-border border-y-2 border-border">
        {#each visible as p (p.id)}
          {@const name = p.display_name ?? p.handle ?? 'Anonym'}
          <li>
            <a
              href={`/u/${p.id}`}
              class="flex items-center gap-4 py-4 transition-colors hover:bg-surface"
            >
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xl font-black text-fg-inverse"
              >
                {name.charAt(0).toUpperCase()}
              </span>
              <span class="flex-1 min-w-0">
                <span
                  class="block font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                >
                  {name}
                </span>
                {#if p.handle}
                  <span class="block truncate font-mono text-xs text-fg-muted">@{p.handle}</span>
                {/if}
              </span>
              <span class="font-mono text-xs text-fg-muted">→</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
