<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    body: string;
    pinned: boolean;
    updated_at: string;
  }

  let briefing = $state<Briefing | null>(null);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  const briefingId = $derived(page.params.id);

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
    if (!client || !briefingId) return;
    loading = true;
    errorMsg = null;
    try {
      const { data, error } = await client
        .from('crew_briefings')
        .select('id, department, title, body, pinned, updated_at')
        .eq('id', briefingId)
        .maybeSingle();
      if (error) throw error;
      briefing = data as Briefing | null;
    } catch (err) {
      console.error('[crew/briefings/detail] load failed', err);
      errorMsg = 'Konnte das Briefing nicht laden.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>{briefing?.title ?? 'Briefing'} · ENERGIZE</title>
</svelte:head>

<Container size="md">
  <section class="py-12 md:py-16">
    <a
      href="/crew/briefings"
      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-accent"
    >
      ← zurueck zu Briefings
    </a>

    {#if errorMsg}
      <p class="mt-4 border-l-4 border-[var(--color-red,#E24B4A)] bg-surface p-3 font-mono text-sm">
        {errorMsg}
      </p>
    {/if}

    {#if loading}
      <p class="mt-8 text-fg-muted">Lade ...</p>
    {:else if !briefing}
      <p class="mt-8 text-fg-muted">Briefing nicht gefunden.</p>
    {:else}
      <p class="mt-6 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ {briefing.department}
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3rem);"
      >
        {briefing.title}
      </h1>
      <p
        class="mt-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        aktualisiert {new Date(briefing.updated_at).toLocaleDateString('de-DE')}
      </p>

      <article class="mt-8 whitespace-pre-line text-base leading-relaxed text-fg">
        {briefing.body}
      </article>

      {#if auth.isAdmin}
        <div class="mt-10 border-t border-border pt-6">
          <Button href="/admin/briefings" variant="ghost">Im Admin bearbeiten</Button>
        </div>
      {/if}
    {/if}
  </section>
</Container>
