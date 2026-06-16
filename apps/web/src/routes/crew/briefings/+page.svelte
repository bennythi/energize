<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    pinned: boolean;
    updated_at: string;
  }

  let briefings = $state<Briefing[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.canRead(CREW_RESOURCES.briefings) && auth.adminChecked) {
      void goto('/crew', { replaceState: true });
    }
  });

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const { data, error } = await client
        .from('crew_briefings')
        .select('id, department, title, pinned, updated_at')
        .order('department')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      briefings = (data ?? []) as Briefing[];
    } catch (err) {
      console.error('[crew/briefings] load failed', err);
      errorMsg = 'Konnte Briefings nicht laden.';
    } finally {
      loading = false;
    }
  }

  const groups = $derived.by(() => {
    const map = new Map<string, Briefing[]>();
    for (const b of briefings) {
      const list = map.get(b.department) ?? [];
      list.push(b);
      map.set(b.department, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Crew · Briefings · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-12 md:py-16">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Briefings
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        Briefings
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-fg-muted">
        Briefing-Dokumente, gruppiert nach Abteilung. Angepinnte Briefings stehen oben.
      </p>
    </div>
  </Container>
</section>

<Container>
  <section class="py-10 md:py-12">
    {#if errorMsg}
      <p class="mb-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    {#if loading}
      <p class="text-fg-muted">Lade ...</p>
    {:else if groups.length === 0}
      <p class="text-fg-muted">Noch keine Briefings hinterlegt.</p>
    {:else}
      {#each groups as [department, list] (department)}
        <section class="mt-8 first:mt-0">
          <h2
            class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
          >
            {department}
          </h2>
          <ul class="mt-3 divide-y divide-border border-y border-border">
            {#each list as b (b.id)}
              <li>
                <a
                  href={`/crew/briefings/${b.id}`}
                  class="block p-3 transition-colors hover:bg-surface"
                >
                  <p class="font-mono text-sm text-fg">
                    {#if b.pinned}<span class="text-accent">★</span>
                    {/if}{b.title}
                  </p>
                  <p
                    class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    aktualisiert {new Date(b.updated_at).toLocaleDateString('de-DE')}
                  </p>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  </section>
</Container>
