<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import { parsePbDate } from '$lib/crew/dates';
  import BackLink from '$lib/crew/BackLink.svelte';
  import NoAccess from '$lib/crew/NoAccess.svelte';

  interface Briefing {
    id: string;
    department: string;
    title: string;
    body: string;
    pinned: boolean;
    updated: string;
  }

  const canRead = $derived(auth.canRead(CREW_RESOURCES.briefings));
  const briefingId = $derived(page.params.id ?? '');

  let briefing = $state<Briefing | null>(null);
  let loading = $state(true);
  let notFound = $state(false);
  let errorMsg = $state<string | null>(null);

  // Neu laden, wenn sich die ID aendert (Navigation zwischen Briefings).
  $effect(() => {
    const id = briefingId;
    if (!canRead) {
      loading = false;
      return;
    }
    void load(id);
  });

  async function load(id: string) {
    const pb = auth.pb;
    if (!pb || !id) return;
    loading = true;
    notFound = false;
    errorMsg = null;
    try {
      const r = await pb.collection('crew_briefings').getOne(id);
      briefing = {
        id: r.id,
        department: r.department,
        title: r.title,
        body: r.body ?? '',
        pinned: r.pinned === true,
        updated: r.updated,
      };
    } catch (err) {
      briefing = null;
      if ((err as { status?: number })?.status === 404) {
        notFound = true;
      } else {
        console.error('[crew/briefings/detail] load failed', err);
        errorMsg = errorMessage(err, 'Konnte das Briefing nicht laden.');
      }
    } finally {
      loading = false;
    }
  }

  function fmtDate(value: string): string {
    return parsePbDate(value).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>{briefing?.title ?? 'Briefing'} · Crew</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-5 py-10 md:py-16">
  <BackLink href="/crew/briefings" label="Alle Briefings" />

  {#if !canRead}
    <NoAccess area="die Briefings" />
  {:else if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else if errorMsg}
    <p class="card mt-8 p-4 text-sm text-danger" role="alert">{errorMsg}</p>
  {:else if notFound || !briefing}
    <div class="card mt-8 p-6">
      <p class="font-medium text-fg">Briefing nicht gefunden</p>
      <p class="mt-2 text-sm text-fg-muted">Vielleicht wurde es geloescht oder verschoben.</p>
    </div>
  {:else}
    <p class="mt-6 text-xs font-medium uppercase tracking-wider text-accent">
      {briefing.department}{briefing.pinned ? ' · angepinnt' : ''}
    </p>
    <h1 class="mt-2 break-words text-3xl font-semibold tracking-tight text-fg md:text-4xl">
      {briefing.title}
    </h1>
    <p class="mt-2 text-sm text-fg-muted">Aktualisiert {fmtDate(briefing.updated)}</p>

    <article class="card mt-8 p-6 md:p-8">
      {#if briefing.body.trim()}
        <!-- prettier-ignore -->
        <div class="whitespace-pre-wrap break-words text-base leading-relaxed text-fg">{briefing.body.replace(/^\s*\n|\s+$/g, '')}</div>
      {:else}
        <p class="text-fg-muted">Dieses Briefing hat noch keinen Inhalt.</p>
      {/if}
    </article>

    {#if auth.isAdmin}
      <div class="mt-8">
        <Button href="/admin/briefings" variant="ghost">Im Admin bearbeiten</Button>
      </div>
    {/if}
  {/if}
</div>
