<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';

  interface Register {
    id: string;
    name: string;
    location: string | null;
    is_active: boolean;
  }
  interface Shift {
    id: string;
    register_id: string;
    opened_at: string;
    closed_at: string | null;
    starting_cents: number;
    ending_cents: number | null;
  }

  let registers = $state<Register[]>([]);
  let openShifts = $state<Map<string, Shift>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.canRead(CREW_RESOURCES.kasse) && auth.adminChecked) {
      void goto('/crew', { replaceState: true });
    }
  });

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const [regRes, openRes] = await Promise.all([
        client.from('cashless_registers').select('id, name, location, is_active').order('name'),
        client
          .from('cashless_shifts')
          .select('id, register_id, opened_at, closed_at, starting_cents, ending_cents')
          .is('closed_at', null),
      ]);
      if (regRes.error) throw regRes.error;
      if (openRes.error) throw openRes.error;
      registers = (regRes.data ?? []).filter((r) => r.is_active) as Register[];
      const m = new Map<string, Shift>();
      for (const s of openRes.data ?? []) m.set(s.register_id, s as Shift);
      openShifts = m;
    } catch (err) {
      console.error('[crew/kasse] load failed', err);
      errorMsg = 'Konnte Kassen nicht laden. Migration 0015 + 0018 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function eur(cents: number): string {
    return (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  }

  function fmtDt(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Crew · Cashless-Kassen · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-12 md:py-16">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Cashless-Kassen
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        Kassen.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-fg-muted">
        Eine Schicht pro Kasse offen. Schicht eroeffnen und schliessen jeweils im Vier-Augen-Prinzip
        mit zwei Kassierern. Stammdaten verwaltet der Admin.
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
    {:else if registers.length === 0}
      <div class="border-2 border-fg-muted bg-surface p-6">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          Keine aktiven Kassen
        </p>
        {#if auth.isAdmin}
          <p class="mt-2 text-fg">
            Leg unter <a href="/admin/cashless-kassen" class="text-accent hover:underline"
              >/admin/cashless-kassen</a
            >
            die erste Kasse an.
          </p>
        {:else}
          <p class="mt-2 text-fg-muted">
            Sag einem Admin Bescheid, dass die Kassen-Stammdaten angelegt werden muessen.
          </p>
        {/if}
      </div>
    {:else}
      <ul class="grid gap-4 md:grid-cols-2">
        {#each registers as r (r.id)}
          {@const shift = openShifts.get(r.id)}
          <li>
            <a
              href={`/crew/kasse/${r.id}`}
              class="card-press block h-full border-2 p-5 transition-colors hover:bg-surface {shift
                ? 'border-accent'
                : 'border-fg'}"
            >
              <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
                {r.location ?? 'Standort offen'}
              </p>
              <p
                class="mt-2 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {r.name}
              </p>
              {#if shift}
                <div class="mt-4 border-l-4 border-accent bg-bg p-3">
                  <p
                    class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
                  >
                    Offene Schicht
                  </p>
                  <p class="mt-1 font-mono text-sm text-fg">seit {fmtDt(shift.opened_at)}</p>
                  <p class="mt-1 font-mono text-xs text-fg-muted">
                    Start: {eur(shift.starting_cents)}
                  </p>
                </div>
              {:else}
                <p
                  class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  Keine offene Schicht. Klick zum Eroeffnen.
                </p>
              {/if}
            </a>
          </li>
        {/each}
      </ul>

      {#if auth.isAdmin}
        <div class="mt-8">
          <Button href="/admin/cashless-kassen" variant="ghost">Kassen-Stammdaten</Button>
        </div>
      {/if}
    {/if}
  </section>
</Container>
