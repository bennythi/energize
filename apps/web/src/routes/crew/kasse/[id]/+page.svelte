<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import DenominationForm from '$lib/DenominationForm.svelte';
  import { DENOMINATIONS } from '$lib/denominations';

  interface Register {
    id: string;
    name: string;
    location: string | null;
  }
  interface Shift {
    id: string;
    register_id: string;
    opened_at: string;
    opened_by_a: string;
    opened_by_b: string;
    closed_at: string | null;
    closed_by_a: string | null;
    closed_by_b: string | null;
    starting_cents: number;
    ending_cents: number | null;
    note: string | null;
  }
  interface Movement {
    id: string;
    kind: 'withdrawal' | 'exchange_in' | 'exchange_out';
    amount_cents: number;
    counterpart_register_id: string | null;
    performed_at: string;
    performed_by_a: string;
    performed_by_b: string;
    note: string | null;
  }
  interface Member {
    id: string;
    display_name: string | null;
    handle: string | null;
  }

  const registerId = $derived(page.params.id);

  let register = $state<Register | null>(null);
  let shift = $state<Shift | null>(null);
  let movements = $state<Movement[]>([]);
  let members = $state<Map<string, Member>>(new Map());
  let allRegisters = $state<Register[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let acting = $state(false);

  // Open-Form
  let showOpenForm = $state(false);
  let openPartner = $state('');
  let openCounts = $state<Record<number, number>>({});

  // Close-Form
  let showCloseForm = $state(false);
  let closePartner = $state('');
  let closeCounts = $state<Record<number, number>>({});
  let closeNote = $state('');

  // Movement-Form
  let showMovementForm = $state(false);
  let mvKind = $state<'withdrawal' | 'exchange_in' | 'exchange_out'>('withdrawal');
  let mvAmount = $state(''); // in EUR
  let mvCounterpart = $state('');
  let mvPartner = $state('');
  let mvNote = $state('');

  // Summary
  let summary = $state<{
    starting_cents: number;
    movement_in_cents: number;
    movement_out_cents: number;
    expected_cents: number;
    ending_cents: number | null;
    difference_cents: number | null;
  } | null>(null);

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
    if (!client || !registerId) return;
    loading = true;
    errorMsg = null;
    try {
      const [regRes, allRegRes, shiftRes, memRes] = await Promise.all([
        client
          .from('cashless_registers')
          .select('id, name, location')
          .eq('id', registerId)
          .maybeSingle(),
        client.from('cashless_registers').select('id, name, location').eq('is_active', true),
        client
          .from('cashless_shifts')
          .select(
            'id, register_id, opened_at, opened_by_a, opened_by_b, closed_at, closed_by_a, closed_by_b, starting_cents, ending_cents, note',
          )
          .eq('register_id', registerId)
          .is('closed_at', null)
          .maybeSingle(),
        client.rpc('crew_list_members'),
      ]);
      if (regRes.error) throw regRes.error;
      if (shiftRes.error) throw shiftRes.error;
      register = regRes.data as Register | null;
      allRegisters = (allRegRes.data ?? []).filter((r) => r.id !== registerId) as Register[];
      shift = shiftRes.data as Shift | null;

      const m = new Map<string, Member>();
      for (const x of memRes.data ?? []) {
        m.set(x.id, { id: x.id, display_name: x.display_name, handle: x.handle });
      }
      members = m;

      if (shift) {
        const [mvRes, sumRes] = await Promise.all([
          client
            .from('cashless_movements')
            .select(
              'id, kind, amount_cents, counterpart_register_id, performed_at, performed_by_a, performed_by_b, note',
            )
            .eq('shift_id', shift.id)
            .order('performed_at'),
          client.rpc('cashless_shift_summary', { target_shift_id: shift.id }),
        ]);
        if (mvRes.error) throw mvRes.error;
        movements = (mvRes.data ?? []) as Movement[];
        summary = (sumRes.data?.[0] ?? null) as typeof summary;
      } else {
        movements = [];
        summary = null;
      }
    } catch (err) {
      console.error('[crew/kasse/detail] load failed', err);
      errorMsg = 'Konnte die Kasse nicht laden.';
    } finally {
      loading = false;
    }
  }

  function memberLabel(userId: string | null | undefined): string {
    if (!userId) return '?';
    const m = members.get(userId);
    return m?.display_name || (m?.handle ? `@${m.handle}` : '?');
  }

  function eur(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) return '—';
    return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }
  function fmtDt(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const startingTotal = $derived(
    DENOMINATIONS.reduce((s: number, d) => s + (openCounts[d.cents] ?? 0) * d.cents, 0),
  );
  const closingTotal = $derived(
    DENOMINATIONS.reduce((s: number, d) => s + (closeCounts[d.cents] ?? 0) * d.cents, 0),
  );

  const otherCrew = $derived(
    [...members.values()]
      .filter((m) => m.id !== auth.user?.id)
      .sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? '')),
  );

  async function openShift() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !registerId) return;
    if (!openPartner) {
      errorMsg = 'Zweiter Kassierer fehlt.';
      return;
    }
    if (startingTotal <= 0) {
      errorMsg = 'Startbestand ist null. Bitte Stueckelungen eingeben.';
      return;
    }
    acting = true;
    errorMsg = null;
    try {
      // Schicht anlegen
      const { data: newShift, error: insertErr } = await client
        .from('cashless_shifts')
        .insert({
          register_id: registerId,
          opened_by_a: user.id,
          opened_by_b: openPartner,
          starting_cents: startingTotal,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      // Stueckelungen einfuegen (nur Werte > 0)
      const denomRows = DENOMINATIONS.filter((d) => (openCounts[d.cents] ?? 0) > 0).map((d) => ({
        shift_id: newShift.id,
        kind: 'start' as const,
        denomination_cents: d.cents,
        count: openCounts[d.cents],
      }));
      if (denomRows.length > 0) {
        const { error: denomErr } = await client
          .from('cashless_shift_denominations')
          .insert(denomRows);
        if (denomErr) throw denomErr;
      }

      showOpenForm = false;
      openPartner = '';
      openCounts = {};
      await load();
    } catch (err) {
      console.error('[crew/kasse/detail] open failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  async function addMovement() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !shift) return;
    if (!mvPartner) {
      errorMsg = 'Zweiter Kassierer fehlt.';
      return;
    }
    const amountCents = Math.round(parseFloat(mvAmount.replace(',', '.')) * 100);
    if (!amountCents || amountCents <= 0) {
      errorMsg = 'Betrag ungueltig.';
      return;
    }
    acting = true;
    errorMsg = null;
    try {
      const { error } = await client.from('cashless_movements').insert({
        shift_id: shift.id,
        kind: mvKind,
        amount_cents: amountCents,
        counterpart_register_id: mvKind === 'withdrawal' ? null : mvCounterpart || null,
        performed_by_a: user.id,
        performed_by_b: mvPartner,
        note: mvNote.trim() || null,
      });
      if (error) throw error;
      showMovementForm = false;
      mvAmount = '';
      mvCounterpart = '';
      mvPartner = '';
      mvNote = '';
      await load();
    } catch (err) {
      console.error('[crew/kasse/detail] movement failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  async function closeShift() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !shift) return;
    if (!closePartner) {
      errorMsg = 'Zweiter Kassierer fehlt.';
      return;
    }
    acting = true;
    errorMsg = null;
    const currentShift = shift;
    try {
      // End-Stueckelungen schreiben
      const denomRows = DENOMINATIONS.filter((d) => (closeCounts[d.cents] ?? 0) > 0).map((d) => ({
        shift_id: currentShift.id,
        kind: 'end' as const,
        denomination_cents: d.cents,
        count: closeCounts[d.cents],
      }));
      if (denomRows.length > 0) {
        const { error: denomErr } = await client
          .from('cashless_shift_denominations')
          .insert(denomRows);
        if (denomErr) throw denomErr;
      }

      // Schicht schliessen
      const { error: updErr } = await client
        .from('cashless_shifts')
        .update({
          closed_at: new Date().toISOString(),
          closed_by_a: user.id,
          closed_by_b: closePartner,
          ending_cents: closingTotal,
          note: closeNote.trim() || currentShift.note,
        })
        .eq('id', currentShift.id);
      if (updErr) throw updErr;

      showCloseForm = false;
      closePartner = '';
      closeCounts = {};
      closeNote = '';
      await load();
    } catch (err) {
      console.error('[crew/kasse/detail] close failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      acting = false;
    }
  }

  const movementLabels: Record<Movement['kind'], string> = {
    withdrawal: 'Entnahme',
    exchange_in: 'Wechsel rein',
    exchange_out: 'Wechsel raus',
  };

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Kasse · {register?.name ?? '...'} · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-10 md:py-12">
      <a
        href="/crew/kasse"
        class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-accent"
      >
        ← zurueck zu Kassen
      </a>
      <p class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Kasse
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        {register?.name ?? '...'}
      </h1>
      {#if register?.location}
        <p class="mt-2 font-mono text-xs text-fg-muted">{register.location}</p>
      {/if}
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
    {:else if !shift}
      <div class="border-2 border-fg p-6">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          Keine offene Schicht
        </p>
        <p class="mt-2 text-fg">
          Mit dem Eroeffnen-Klick fuegst du eine neue Schicht hinzu. Du brauchst einen zweiten
          Kassierer und ihr zaehlt den Wechselgeld-Startbestand gemeinsam.
        </p>
        {#if auth.canWrite(CREW_RESOURCES.kasse)}
          <div class="mt-4">
            <Button variant="yellow" onclick={() => (showOpenForm = true)}>
              Schicht eroeffnen
            </Button>
          </div>
        {:else}
          <p class="mt-3 font-mono text-xs text-fg-muted">
            Du hast nur Lese-Recht. Schicht-Workflow braucht write.
          </p>
        {/if}
      </div>
    {:else}
      <!-- Offene Schicht -->
      <div class="border-l-4 border-accent bg-surface p-5">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          Schicht offen seit {fmtDt(shift.opened_at)}
        </p>
        <p class="mt-2 font-mono text-sm text-fg">
          eroeffnet von {memberLabel(shift.opened_by_a)} + {memberLabel(shift.opened_by_b)}
        </p>

        {#if summary}
          <div class="mt-4 grid gap-3 sm:grid-cols-4">
            <div class="border-l-2 border-fg-muted bg-bg p-3">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                Start
              </p>
              <p class="mt-1 font-display text-xl font-black tabular-nums text-fg">
                {eur(summary.starting_cents)}
              </p>
            </div>
            <div class="border-l-2 border-accent bg-bg p-3">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                Eingang
              </p>
              <p class="mt-1 font-display text-xl font-black tabular-nums text-fg">
                {eur(summary.movement_in_cents)}
              </p>
            </div>
            <div class="border-l-2 border-[var(--color-red,#E24B4A)] bg-bg p-3">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                Ausgang
              </p>
              <p class="mt-1 font-display text-xl font-black tabular-nums text-fg">
                {eur(summary.movement_out_cents)}
              </p>
            </div>
            <div class="border-l-2 border-accent bg-bg p-3">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
              >
                Erwartet
              </p>
              <p class="mt-1 font-display text-xl font-black tabular-nums text-accent">
                {eur(summary.expected_cents)}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Bewegungen -->
      <section class="mt-8">
        <div class="flex items-baseline justify-between">
          <h2
            class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
          >
            Bewegungen ({movements.length})
          </h2>
          {#if auth.canWrite(CREW_RESOURCES.kasse)}
            <Button variant="ghost" onclick={() => (showMovementForm = true)}>+ Bewegung</Button>
          {/if}
        </div>
        {#if movements.length === 0}
          <p class="mt-3 text-sm text-fg-muted">Noch keine Bewegungen.</p>
        {:else}
          <ul class="mt-3 divide-y divide-border border-y border-border">
            {#each movements as m (m.id)}
              <li class="flex items-start justify-between gap-3 p-3 text-sm">
                <div>
                  <p class="font-mono text-fg">
                    {movementLabels[m.kind]}
                    <span class="ml-2 font-display text-base font-black tabular-nums">
                      {eur(m.amount_cents)}
                    </span>
                  </p>
                  <p class="mt-1 font-mono text-[11px] text-fg-muted">
                    {fmtDt(m.performed_at)} · {memberLabel(m.performed_by_a)} + {memberLabel(
                      m.performed_by_b,
                    )}
                  </p>
                  {#if m.note}
                    <p class="mt-1 text-xs text-fg-muted">{m.note}</p>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- Schicht schliessen -->
      {#if auth.canWrite(CREW_RESOURCES.kasse)}
        <div class="mt-8">
          <Button variant="yellow" onclick={() => (showCloseForm = true)}>Schicht schliessen</Button
          >
        </div>
      {/if}
    {/if}
  </section>
</Container>

<!-- OPEN-FORM -->
{#if showOpenForm}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex max-h-[92vh] w-full max-w-3xl flex-col border-2 border-accent bg-bg">
      <header class="border-b border-border p-4">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          Schicht eroeffnen
        </p>
      </header>
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Zweiter Kassierer (Vier-Augen)
          </span>
          <select
            bind:value={openPartner}
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">Bitte waehlen ...</option>
            {#each otherCrew as p (p.id)}
              <option value={p.id}>{p.display_name ?? p.handle ?? p.id.slice(0, 8)}</option>
            {/each}
          </select>
        </label>
        <div>
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Wechselgeld-Startbestand
          </p>
          <div class="mt-2">
            <DenominationForm bind:counts={openCounts} onUpdate={(c) => (openCounts = c)} />
          </div>
        </div>
      </div>
      <footer class="flex gap-3 border-t border-border p-4">
        <Button
          variant="yellow"
          onclick={openShift}
          disabled={acting || !openPartner || startingTotal <= 0}
        >
          {acting ? 'Speichere ...' : 'Schicht eroeffnen'}
        </Button>
        <Button variant="ghost" onclick={() => (showOpenForm = false)} disabled={acting}>
          Abbrechen
        </Button>
      </footer>
    </div>
  </div>
{/if}

<!-- MOVEMENT-FORM -->
{#if showMovementForm}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-md border-2 border-accent bg-bg p-5">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Bewegung erfassen
      </p>
      <div class="mt-4 space-y-4">
        <fieldset class="grid grid-cols-3 gap-2">
          {#each ['withdrawal', 'exchange_in', 'exchange_out'] as const as k (k)}
            <label>
              <input type="radio" bind:group={mvKind} value={k} class="peer sr-only" />
              <span
                class="block cursor-pointer border-2 border-border p-2 text-center font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-fg-inverse"
              >
                {movementLabels[k]}
              </span>
            </label>
          {/each}
        </fieldset>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Betrag in EUR
          </span>
          <input
            type="text"
            bind:value={mvAmount}
            placeholder="0,00"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>

        {#if mvKind !== 'withdrawal'}
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Andere Kasse (optional)
            </span>
            <select
              bind:value={mvCounterpart}
              class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
            >
              <option value="">extern / nicht relevant</option>
              {#each allRegisters as r (r.id)}
                <option value={r.id}>{r.name}</option>
              {/each}
            </select>
          </label>
        {/if}

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Zweiter Kassierer
          </span>
          <select
            bind:value={mvPartner}
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">Bitte waehlen ...</option>
            {#each otherCrew as p (p.id)}
              <option value={p.id}>{p.display_name ?? p.handle ?? p.id.slice(0, 8)}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Notiz (optional)
          </span>
          <input
            type="text"
            bind:value={mvNote}
            maxlength="500"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div class="mt-5 flex gap-3">
        <Button variant="yellow" onclick={addMovement} disabled={acting || !mvPartner || !mvAmount}>
          {acting ? 'Speichere ...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onclick={() => (showMovementForm = false)} disabled={acting}>
          Abbrechen
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- CLOSE-FORM -->
{#if showCloseForm}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex max-h-[92vh] w-full max-w-3xl flex-col border-2 border-accent bg-bg">
      <header class="border-b border-border p-4">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          Schicht schliessen
        </p>
      </header>
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Zweiter Kassierer (Vier-Augen)
          </span>
          <select
            bind:value={closePartner}
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="">Bitte waehlen ...</option>
            {#each otherCrew as p (p.id)}
              <option value={p.id}>{p.display_name ?? p.handle ?? p.id.slice(0, 8)}</option>
            {/each}
          </select>
        </label>
        <div>
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Wechselgeld-Endbestand
          </p>
          <div class="mt-2">
            <DenominationForm bind:counts={closeCounts} onUpdate={(c) => (closeCounts = c)} />
          </div>
        </div>
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Notiz (optional)
          </span>
          <textarea
            bind:value={closeNote}
            rows="3"
            maxlength="1000"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none"
          ></textarea>
        </label>
        {#if summary}
          <div class="border-2 border-accent bg-surface p-4">
            <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
              Saldo-Vorschau
            </p>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <span class="text-fg-muted">Erwartet</span>
              <span class="text-right font-display font-black tabular-nums text-fg">
                {eur(summary.expected_cents)}
              </span>
              <span class="text-fg-muted">Endbestand (real)</span>
              <span class="text-right font-display font-black tabular-nums text-fg">
                {eur(closingTotal)}
              </span>
              <span class="text-accent">Differenz</span>
              <span
                class="text-right font-display font-black tabular-nums"
                class:text-[var(--color-red,#E24B4A)]={closingTotal - summary.expected_cents < 0}
                class:text-[var(--color-green,#22C77B)]={closingTotal - summary.expected_cents ===
                  0}
                class:text-accent={closingTotal - summary.expected_cents > 0}
              >
                {eur(closingTotal - summary.expected_cents)}
              </span>
            </div>
          </div>
        {/if}
      </div>
      <footer class="flex gap-3 border-t border-border p-4">
        <Button variant="yellow" onclick={closeShift} disabled={acting || !closePartner}>
          {acting ? 'Schliesse ...' : 'Schicht schliessen'}
        </Button>
        <Button variant="ghost" onclick={() => (showCloseForm = false)} disabled={acting}>
          Abbrechen
        </Button>
      </footer>
    </div>
  </div>
{/if}
