<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { listCrewMembers, memberName, errorMessage, type CrewMember } from '$lib/crew-api';
  import {
    listRegisters,
    listOpenShifts,
    listRecentClosedShifts,
    listMovements,
    openShift,
    type Register,
    type Shift,
    type Movement,
  } from '$lib/cashless/api';
  import {
    computeShiftSummary,
    countsTotal,
    formatDateTime,
    formatEur,
    formatSignedEur,
  } from '$lib/cashless/summary';
  import DenominationInput from '$lib/cashless/DenominationInput.svelte';
  import NoAccess from '$lib/cashless/NoAccess.svelte';

  const canRead = $derived(auth.canRead(CREW_RESOURCES.kasse));
  const canWrite = $derived(auth.canWrite(CREW_RESOURCES.kasse));

  let registers = $state<Register[]>([]);
  let openShifts = $state<Shift[]>([]);
  let closedShifts = $state<Shift[]>([]);
  let closedMovements = $state<Movement[]>([]);
  let members = $state<CrewMember[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  // Formular "Schicht eroeffnen"
  let openFor = $state<Register | null>(null);
  let partner = $state('');
  let counts = $state<Record<number, number>>({});
  let saving = $state(false);
  let formError = $state<string | null>(null);

  const startingTotal = $derived(countsTotal(counts));
  const partners = $derived(
    members
      .filter((m) => m.id !== auth.user?.id)
      .sort((a, b) => memberName(a).localeCompare(memberName(b), 'de')),
  );
  const openByRegister = $derived(new Map(openShifts.map((s) => [s.register, s])));
  // Aktive Kassen plus inaktive, an denen noch eine Schicht offen ist.
  const visibleRegisters = $derived(
    registers.filter((r) => r.is_active || openByRegister.has(r.id)),
  );
  const registerNames = $derived(new Map(registers.map((r) => [r.id, r.name])));

  let started = false;
  $effect(() => {
    if (started || !canRead || !auth.pb) return;
    started = true;
    void load();
  });

  async function load() {
    loading = true;
    errorMsg = null;
    try {
      const [regs, open, closed, crew] = await Promise.all([
        listRegisters(),
        listOpenShifts(),
        listRecentClosedShifts(20),
        listCrewMembers().catch(() => [] as CrewMember[]),
      ]);
      registers = regs;
      openShifts = open;
      closedShifts = closed;
      members = crew;
      closedMovements = await listMovements(closed.map((s) => s.id));
    } catch (err) {
      console.error('[crew/kasse] load failed', err);
      errorMsg = errorMessage(err, 'Konnte die Kassen nicht laden.');
    } finally {
      loading = false;
    }
  }

  function differenceOf(shift: Shift): number | null {
    const mv = closedMovements.filter((m) => m.shift === shift.id);
    return computeShiftSummary(shift, mv).difference_cents;
  }

  function diffClass(cents: number | null): string {
    if (cents === null) return 'text-fg-muted';
    if (cents < 0) return 'text-danger';
    if (cents > 0) return 'text-accent';
    return 'text-success';
  }

  function startOpen(r: Register) {
    openFor = r;
    partner = '';
    counts = {};
    formError = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitOpen(event: SubmitEvent) {
    event.preventDefault();
    if (!openFor) return;
    if (!partner) {
      formError = 'Bitte einen zweiten Kassierer waehlen.';
      return;
    }
    if (startingTotal <= 0) {
      formError = 'Startbestand ist 0. Trag die Stueckzahl pro Geldwert ein.';
      return;
    }
    saving = true;
    formError = null;
    try {
      const id = await openShift({
        register: openFor.id,
        partner,
        counts,
        startingCents: startingTotal,
      });
      await goto(`/crew/kasse/${id}`);
    } catch (err) {
      console.error('[crew/kasse] open failed', err);
      formError = errorMessage(
        err,
        err instanceof Error ? err.message : 'Speichern fehlgeschlagen.',
      );
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Crew · Kassen</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <a href="/crew" class="text-sm text-fg-muted transition-colors hover:text-accent">← Crew</a>
  <p class="mt-6 text-xs font-medium uppercase tracking-wider text-accent">Cashless</p>
  <h1 class="mt-2 text-3xl font-semibold tracking-tight text-fg md:text-4xl">Kassen</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    Pro Kasse ist eine Schicht offen. Eroeffnen, Bewegungen und Abschluss laufen im
    Vier-Augen-Prinzip mit zwei Kassierern.
  </p>

  {#if !canRead}
    <NoAccess />
  {:else if loading}
    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <div class="card h-40 animate-pulse opacity-50"></div>
      <div class="card h-40 animate-pulse opacity-50"></div>
    </div>
  {:else if errorMsg}
    <div class="card mt-8 p-6">
      <p class="text-sm text-danger" role="alert">{errorMsg}</p>
      <div class="mt-4"><Button variant="ghost" onclick={load}>Erneut laden</Button></div>
    </div>
  {:else if openFor}
    <!-- Schicht eroeffnen -->
    <form onsubmit={submitOpen} class="card mt-8 flex flex-col gap-6 p-6">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-accent">Schicht eroeffnen</p>
        <p class="mt-1 text-xl font-semibold text-fg">{openFor.name}</p>
        {#if openFor.location}<p class="text-sm text-fg-muted">{openFor.location}</p>{/if}
      </div>

      <label class="block">
        <span class="text-xs font-medium text-fg-muted">Zweiter Kassierer (Vier-Augen)</span>
        <select bind:value={partner} disabled={saving} class="field mt-2">
          <option value="">Bitte waehlen …</option>
          {#each partners as p (p.id)}
            <option value={p.id}>{memberName(p)}</option>
          {/each}
        </select>
      </label>

      <div>
        <p class="text-sm font-medium text-fg">Wechselgeld-Startbestand</p>
        <p class="mt-1 text-xs text-fg-muted">Stueckzahl pro Geldwert, gemeinsam gezaehlt.</p>
        <div class="mt-4">
          <DenominationInput bind:counts disabled={saving} totalLabel="Startbestand" />
        </div>
      </div>

      {#if formError}<p class="text-sm text-danger" role="alert">{formError}</p>{/if}

      <div class="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || !partner || startingTotal <= 0}>
          {saving ? 'Speichere …' : 'Schicht eroeffnen'}
        </Button>
        <Button variant="ghost" onclick={() => (openFor = null)} disabled={saving}>
          Abbrechen
        </Button>
      </div>
    </form>
  {:else}
    {#if visibleRegisters.length === 0}
      <div class="card mt-8 p-6">
        <p class="font-medium text-fg">Keine aktiven Kassen</p>
        <p class="mt-2 text-sm text-fg-muted">
          {#if auth.isAdmin}
            Leg unter <a href="/admin/cashless-kassen" class="text-accent hover:underline"
              >Admin → Kassen</a
            > die erste Kasse an.
          {:else}
            Sag einem Admin Bescheid, dass die Kassen-Stammdaten angelegt werden muessen.
          {/if}
        </p>
      </div>
    {:else}
      <ul class="stagger-list mt-8 grid gap-4 sm:grid-cols-2">
        {#each visibleRegisters as r (r.id)}
          {@const shift = openByRegister.get(r.id)}
          <li class="card flex h-full flex-col p-6">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-lg font-semibold text-fg">{r.name}</p>
                <p class="text-sm text-fg-muted">{r.location || 'Standort offen'}</p>
              </div>
              {#if shift}
                <span class="shrink-0 text-xs font-medium text-success">● Offen</span>
              {:else}
                <span class="shrink-0 text-xs font-medium text-fg-muted">○ Zu</span>
              {/if}
            </div>

            {#if shift}
              <p class="mt-4 text-sm text-fg-muted">
                Seit {formatDateTime(shift.opened_at)} · Start
                <span class="tabular-nums text-fg">{formatEur(shift.starting_cents)}</span>
              </p>
              <div class="mt-auto pt-5">
                <Button href={`/crew/kasse/${shift.id}`}>Zur Schicht →</Button>
              </div>
            {:else}
              <p class="mt-4 text-sm text-fg-muted">Keine offene Schicht.</p>
              {#if canWrite && r.is_active}
                <div class="mt-auto pt-5">
                  <Button variant="ghost" onclick={() => startOpen(r)}>Schicht eroeffnen</Button>
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if closedShifts.length > 0}
      <h2 class="mt-12 text-xl font-semibold tracking-tight text-fg">Letzte Schichten</h2>
      <ul class="card mt-4 divide-y divide-[var(--glass-border)]">
        {#each closedShifts as s (s.id)}
          {@const diff = differenceOf(s)}
          <li>
            <a
              href={`/crew/kasse/${s.id}`}
              class="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--glass-bg-strong)]"
            >
              <span class="min-w-0">
                <span class="block truncate font-medium text-fg">
                  {s.expand?.register?.name ?? registerNames.get(s.register) ?? 'Kasse'}
                </span>
                <span class="block text-xs text-fg-muted">
                  {formatDateTime(s.opened_at)} – {formatDateTime(s.closed_at)}
                </span>
              </span>
              <span class="shrink-0 text-right">
                <span class="block text-sm tabular-nums {diffClass(diff)}">
                  {diff === null ? 'ohne Zaehlung' : formatSignedEur(diff)}
                </span>
                <span class="block text-xs text-fg-muted">Differenz</span>
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    {#if auth.isAdmin}
      <div class="mt-10">
        <Button href="/admin/cashless-kassen" variant="ghost">Kassen-Stammdaten</Button>
      </div>
    {/if}
  {/if}
</div>
