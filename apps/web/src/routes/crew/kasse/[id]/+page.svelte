<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { listCrewMembers, memberName, errorMessage, type CrewMember } from '$lib/crew-api';
  import {
    getShift,
    listMovements,
    listDenominations,
    listRegisters,
    addMovement,
    closeShift,
    isOpen,
    type Shift,
    type Movement,
    type Register,
    type DenominationRow,
  } from '$lib/cashless/api';
  import {
    computeShiftSummary,
    countsFromRows,
    countsTotal,
    formatDateTime,
    formatEur,
    formatSignedEur,
    parseEuroToCents,
    MOVEMENT_LABELS,
    type MovementKind,
  } from '$lib/cashless/summary';
  import DenominationInput from '$lib/cashless/DenominationInput.svelte';
  import DenominationList from '$lib/cashless/DenominationList.svelte';
  import NoAccess from '$lib/cashless/NoAccess.svelte';
  import { t, lang } from '$lib/i18n';

  const shiftId = $derived(page.params.id ?? '');
  const canRead = $derived(auth.canRead(CREW_RESOURCES.kasse));
  const canWrite = $derived(auth.canWrite(CREW_RESOURCES.kasse));

  let shift = $state<Shift | null>(null);
  let movements = $state<Movement[]>([]);
  let denoms = $state<DenominationRow[]>([]);
  let registers = $state<Register[]>([]);
  let members = $state<CrewMember[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let notFound = $state(false);

  // Formulare: nur eins gleichzeitig.
  let mode = $state<'none' | 'movement' | 'close'>('none');
  let saving = $state(false);
  let formError = $state<string | null>(null);

  let mvKind = $state<MovementKind>('withdrawal');
  let mvAmount = $state('');
  let mvCounterpart = $state('');
  let mvPartner = $state('');
  let mvNote = $state('');

  let closePartner = $state('');
  let closeCounts = $state<Record<number, number>>({});
  let closeNote = $state('');

  const open = $derived(shift ? isOpen(shift) : false);
  const register = $derived(shift?.expand?.register ?? null);
  const summary = $derived(shift ? computeShiftSummary(shift, movements) : null);
  const startCounts = $derived(countsFromRows(denoms, 'start'));
  const endCounts = $derived(countsFromRows(denoms, 'end'));
  const closingTotal = $derived(countsTotal(closeCounts));
  const closePreview = $derived(summary ? closingTotal - summary.expected_cents : 0);
  const memberById = $derived(new Map(members.map((m) => [m.id, m])));
  const registerById = $derived(new Map(registers.map((r) => [r.id, r])));
  const partners = $derived(
    members
      .filter((m) => m.id !== auth.user?.id)
      .sort((a, b) => memberName(a).localeCompare(memberName(b), lang)),
  );
  const counterparts = $derived(registers.filter((r) => r.is_active && r.id !== shift?.register));
  const mvCents = $derived(parseEuroToCents(mvAmount));

  let loadedFor = '';
  $effect(() => {
    if (!canRead || !auth.pb || !shiftId || loadedFor === shiftId) return;
    loadedFor = shiftId;
    void load();
  });

  async function load() {
    loading = shift === null;
    errorMsg = null;
    notFound = false;
    try {
      const [s, mv, dn, regs, crew] = await Promise.all([
        getShift(shiftId),
        listMovements([shiftId]),
        listDenominations(shiftId),
        listRegisters(),
        listCrewMembers().catch(() => [] as CrewMember[]),
      ]);
      shift = s;
      movements = mv;
      denoms = dn;
      registers = regs;
      members = crew;
    } catch (err) {
      console.error('[crew/kasse/detail] load failed', err);
      if ((err as { status?: number })?.status === 404) notFound = true;
      else
        errorMsg = errorMessage(
          err,
          t('Konnte die Schicht nicht laden.', 'Could not load the shift.'),
        );
    } finally {
      loading = false;
    }
  }

  function who(a: string, b: string): string {
    const name = (id: string) => (id ? memberName(memberById.get(id)) : '?');
    return `${name(a)} + ${name(b)}`;
  }

  function diffClass(cents: number | null): string {
    if (cents === null) return 'text-fg-muted';
    if (cents < 0) return 'text-danger';
    if (cents > 0) return 'text-accent';
    return 'text-success';
  }

  function showForm(next: 'movement' | 'close') {
    mode = next;
    formError = null;
    if (next === 'movement') {
      mvKind = 'withdrawal';
      mvAmount = '';
      mvCounterpart = '';
      mvNote = '';
    } else {
      closeCounts = {};
      closeNote = '';
    }
  }

  async function submitMovement(event: SubmitEvent) {
    event.preventDefault();
    if (!shift) return;
    if (!mvPartner) {
      formError = t('Bitte einen zweiten Kassierer waehlen.', 'Please choose a second cashier.');
      return;
    }
    if (!mvCents) {
      formError = t(
        'Betrag ungueltig. Beispiel: 50 oder 12,50',
        'Invalid amount. Example: 50 or 12.50',
      );
      return;
    }
    saving = true;
    formError = null;
    try {
      await addMovement({
        shift: shift.id,
        kind: mvKind,
        amountCents: mvCents,
        counterpart: mvCounterpart,
        partner: mvPartner,
        note: mvNote,
      });
      mode = 'none';
      await load();
    } catch (err) {
      console.error('[crew/kasse/detail] movement failed', err);
      formError = errorMessage(
        err,
        err instanceof Error ? err.message : t('Speichern fehlgeschlagen.', 'Saving failed.'),
      );
    } finally {
      saving = false;
    }
  }

  async function submitClose(event: SubmitEvent) {
    event.preventDefault();
    if (!shift) return;
    if (!closePartner) {
      formError = t('Bitte einen zweiten Kassierer waehlen.', 'Please choose a second cashier.');
      return;
    }
    if (
      closingTotal === 0 &&
      !confirm(
        t(
          'Endbestand ist 0,00 €. Schicht trotzdem so schliessen?',
          'Closing float is €0.00. Close the shift anyway?',
        ),
      )
    ) {
      return;
    }
    saving = true;
    formError = null;
    try {
      await closeShift({
        shift,
        partner: closePartner,
        counts: closeCounts,
        endingCents: closingTotal,
        note: closeNote,
      });
      mode = 'none';
      await load();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('[crew/kasse/detail] close failed', err);
      formError = errorMessage(
        err,
        err instanceof Error ? err.message : t('Schliessen fehlgeschlagen.', 'Closing failed.'),
      );
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{t('Crew · Kasse', 'Crew · Cash register')} {register?.name ?? ''}</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <a href="/crew/kasse" class="text-sm text-fg-muted transition-colors hover:text-accent">
    ← {t('Kassen', 'Cash registers')}
  </a>

  {#if !canRead}
    <NoAccess />
  {:else if loading}
    <div class="mt-6 h-10 w-48 animate-pulse rounded-lg bg-[var(--glass-bg)]"></div>
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else if notFound}
    <div class="card mt-8 p-6">
      <p class="font-medium text-fg">{t('Schicht nicht gefunden', 'Shift not found')}</p>
      <p class="mt-2 text-sm text-fg-muted">
        {t(
          'Der Link ist ungueltig oder die Schicht wurde entfernt.',
          'The link is invalid or the shift has been removed.',
        )}
      </p>
      <div class="mt-5">
        <Button href="/crew/kasse" variant="ghost">
          {t('Zu den Kassen', 'To the cash registers')}
        </Button>
      </div>
    </div>
  {:else if errorMsg || !shift || !summary}
    <div class="card mt-8 p-6">
      <p class="text-sm text-danger" role="alert">
        {errorMsg ?? t('Unbekannter Fehler.', 'Unknown error.')}
      </p>
      <div class="mt-4">
        <Button variant="ghost" onclick={load}>{t('Erneut laden', 'Reload')}</Button>
      </div>
    </div>
  {:else}
    <div class="mt-6 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wider text-accent">
          {open ? t('Offene Schicht', 'Open shift') : t('Abgeschlossene Schicht', 'Closed shift')}
        </p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
          {register?.name ?? t('Kasse', 'Cash register')}
        </h1>
        {#if register?.location}<p class="mt-1 text-fg-muted">{register.location}</p>{/if}
      </div>
    </div>

    <!-- Kopfdaten -->
    <dl class="card mt-8 grid gap-4 p-6 text-sm sm:grid-cols-2">
      <div>
        <dt class="text-xs font-medium text-fg-muted">{t('Eroeffnet', 'Opened')}</dt>
        <dd class="mt-1 text-fg">{formatDateTime(shift.opened_at)}</dd>
        <dd class="text-fg-muted">{who(shift.opened_by_a, shift.opened_by_b)}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium text-fg-muted">{t('Geschlossen', 'Closed')}</dt>
        {#if open}
          <dd class="mt-1 font-medium text-success">● {t('noch offen', 'still open')}</dd>
        {:else}
          <dd class="mt-1 text-fg">{formatDateTime(shift.closed_at)}</dd>
          <dd class="text-fg-muted">{who(shift.closed_by_a, shift.closed_by_b)}</dd>
        {/if}
      </div>
      {#if shift.note}
        <div class="sm:col-span-2">
          <dt class="text-xs font-medium text-fg-muted">{t('Notiz', 'Note')}</dt>
          <dd class="mt-1 whitespace-pre-line text-fg">{shift.note}</dd>
        </div>
      {/if}
    </dl>

    <!-- Saldo -->
    <section class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="card p-4">
        <p class="text-xs text-fg-muted">{t('Start', 'Start')}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums text-fg">
          {formatEur(summary.starting_cents)}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-fg-muted">{t('Eingang', 'In')}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums text-fg">
          {formatEur(summary.movement_in_cents)}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-fg-muted">{t('Ausgang', 'Out')}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums text-fg">
          {formatEur(summary.movement_out_cents)}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-accent">{t('Erwartet', 'Expected')}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums text-accent">
          {formatEur(summary.expected_cents)}
        </p>
      </div>
      {#if summary.ending_cents !== null}
        <div class="card p-4">
          <p class="text-xs text-fg-muted">{t('Gezaehlt', 'Counted')}</p>
          <p class="mt-1 text-lg font-semibold tabular-nums text-fg">
            {formatEur(summary.ending_cents)}
          </p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-fg-muted">{t('Differenz', 'Difference')}</p>
          <p class="mt-1 text-lg font-semibold tabular-nums {diffClass(summary.difference_cents)}">
            {formatSignedEur(summary.difference_cents ?? 0)}
          </p>
        </div>
      {/if}
    </section>

    <!-- Aktionen -->
    {#if open && canWrite && mode === 'none'}
      <div class="mt-6 flex flex-wrap gap-3">
        <Button variant="ghost" onclick={() => showForm('movement')}>
          + {t('Bewegung', 'Movement')}
        </Button>
        <Button onclick={() => showForm('close')}>
          {t('Schicht schliessen', 'Close shift')}
        </Button>
      </div>
    {:else if open && !canWrite}
      <p class="mt-6 text-sm text-fg-muted">
        {t(
          'Du hast nur Leserechte. Bewegungen und Abschluss brauchen Schreibrechte.',
          'You only have read access. Movements and closing require write access.',
        )}
      </p>
    {/if}

    {#if open && canWrite && mode === 'movement'}
      <form onsubmit={submitMovement} class="card mt-6 flex flex-col gap-5 p-6">
        <p class="text-lg font-semibold text-fg">{t('Bewegung erfassen', 'Record movement')}</p>

        <fieldset>
          <legend class="text-xs font-medium text-fg-muted">{t('Art', 'Type')}</legend>
          <div class="seg mt-2">
            {#each Object.keys(MOVEMENT_LABELS) as MovementKind[] as k (k)}
              <button
                type="button"
                aria-pressed={mvKind === k}
                class:on={mvKind === k}
                onclick={() => (mvKind = k)}>{MOVEMENT_LABELS[k]}</button
              >
            {/each}
          </div>
        </fieldset>

        <label class="block">
          <span class="text-xs font-medium text-fg-muted"
            >{t('Betrag in EUR', 'Amount in EUR')}</span
          >
          <input
            type="text"
            inputmode="decimal"
            autocomplete="off"
            bind:value={mvAmount}
            placeholder={t('0,00', '0.00')}
            disabled={saving}
            class="field mt-2 tabular-nums"
          />
          {#if mvAmount && mvCents}
            <span class="mt-1 block text-xs text-fg-muted">= {formatEur(mvCents)}</span>
          {/if}
        </label>

        {#if mvKind !== 'withdrawal'}
          <label class="block">
            <span class="text-xs font-medium text-fg-muted">
              {t('Andere Kasse (optional)', 'Other cash register (optional)')}
            </span>
            <select bind:value={mvCounterpart} disabled={saving} class="field mt-2">
              <option value="">{t('extern / nicht relevant', 'external / not relevant')}</option>
              {#each counterparts as r (r.id)}
                <option value={r.id}>{r.name}</option>
              {/each}
            </select>
          </label>
        {/if}

        <label class="block">
          <span class="text-xs font-medium text-fg-muted"
            >{t('Zweiter Kassierer', 'Second cashier')}</span
          >
          <select bind:value={mvPartner} disabled={saving} class="field mt-2">
            <option value="">{t('Bitte waehlen …', 'Please choose …')}</option>
            {#each partners as p (p.id)}
              <option value={p.id}>{memberName(p)}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="text-xs font-medium text-fg-muted"
            >{t('Notiz (optional)', 'Note (optional)')}</span
          >
          <input
            type="text"
            bind:value={mvNote}
            maxlength="500"
            disabled={saving}
            class="field mt-2"
          />
        </label>

        {#if formError}<p class="text-sm text-danger" role="alert">{formError}</p>{/if}

        <div class="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !mvPartner || !mvCents}>
            {saving ? t('Speichere …', 'Saving …') : t('Speichern', 'Save')}
          </Button>
          <Button variant="ghost" onclick={() => (mode = 'none')} disabled={saving}>
            {t('Abbrechen', 'Cancel')}
          </Button>
        </div>
      </form>
    {/if}

    {#if open && canWrite && mode === 'close'}
      <form onsubmit={submitClose} class="card mt-6 flex flex-col gap-6 p-6">
        <div>
          <p class="text-lg font-semibold text-fg">{t('Schicht schliessen', 'Close shift')}</p>
          <p class="mt-1 text-sm text-fg-muted">
            {t(
              'Endbestand gemeinsam zaehlen. Danach sind keine Aenderungen mehr moeglich.',
              'Count the closing float together. No changes are possible afterwards.',
            )}
          </p>
        </div>

        <label class="block">
          <span class="text-xs font-medium text-fg-muted">
            {t('Zweiter Kassierer (Vier-Augen)', 'Second cashier (four eyes)')}
          </span>
          <select bind:value={closePartner} disabled={saving} class="field mt-2">
            <option value="">{t('Bitte waehlen …', 'Please choose …')}</option>
            {#each partners as p (p.id)}
              <option value={p.id}>{memberName(p)}</option>
            {/each}
          </select>
        </label>

        <div>
          <p class="text-sm font-medium text-fg">
            {t('Wechselgeld-Endbestand', 'Closing change float')}
          </p>
          <div class="mt-4">
            <DenominationInput
              bind:counts={closeCounts}
              disabled={saving}
              totalLabel={t('Endbestand', 'Closing float')}
            />
          </div>
        </div>

        <label class="block">
          <span class="text-xs font-medium text-fg-muted"
            >{t('Notiz (optional)', 'Note (optional)')}</span
          >
          <textarea
            bind:value={closeNote}
            rows="3"
            maxlength="1000"
            disabled={saving}
            class="field mt-2"
          ></textarea>
        </label>

        <div class="rounded-2xl border border-[var(--glass-border)] p-4 text-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-accent">
            {t('Saldo-Vorschau', 'Balance preview')}
          </p>
          <dl class="mt-3 grid grid-cols-2 gap-y-1.5">
            <dt class="text-fg-muted">{t('Erwartet', 'Expected')}</dt>
            <dd class="text-right tabular-nums text-fg">{formatEur(summary.expected_cents)}</dd>
            <dt class="text-fg-muted">{t('Gezaehlt', 'Counted')}</dt>
            <dd class="text-right tabular-nums text-fg">{formatEur(closingTotal)}</dd>
            <dt class="font-medium text-fg">{t('Differenz', 'Difference')}</dt>
            <dd class="text-right font-semibold tabular-nums {diffClass(closePreview)}">
              {formatSignedEur(closePreview)}
            </dd>
          </dl>
        </div>

        {#if formError}<p class="text-sm text-danger" role="alert">{formError}</p>{/if}

        <div class="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !closePartner}>
            {saving ? t('Schliesse …', 'Closing …') : t('Schicht schliessen', 'Close shift')}
          </Button>
          <Button variant="ghost" onclick={() => (mode = 'none')} disabled={saving}>
            {t('Abbrechen', 'Cancel')}
          </Button>
        </div>
      </form>
    {/if}

    <!-- Bewegungen -->
    <section class="mt-10">
      <h2 class="text-xl font-semibold tracking-tight text-fg">
        {t('Bewegungen', 'Movements')} <span class="text-fg-muted">({movements.length})</span>
      </h2>
      {#if movements.length === 0}
        <p class="mt-3 text-sm text-fg-muted">{t('Noch keine Bewegungen.', 'No movements yet.')}</p>
      {:else}
        <ul class="card mt-4 divide-y divide-[var(--glass-border)]">
          {#each movements as m (m.id)}
            <li class="flex items-start justify-between gap-4 px-5 py-4">
              <div class="min-w-0">
                <p class="font-medium text-fg">
                  {MOVEMENT_LABELS[m.kind]}
                  {#if m.counterpart_register}
                    <span class="font-normal text-fg-muted">
                      {m.kind === 'exchange_in' ? t('von', 'from') : t('an', 'to')}
                      {registerById.get(m.counterpart_register)?.name ??
                        t('Kasse', 'Cash register')}
                    </span>
                  {/if}
                </p>
                <p class="mt-0.5 text-xs text-fg-muted">
                  {formatDateTime(m.performed_at)} · {who(m.performed_by_a, m.performed_by_b)}
                </p>
                {#if m.note}<p class="mt-1 text-sm text-fg-muted">{m.note}</p>{/if}
              </div>
              <p
                class="shrink-0 font-semibold tabular-nums {m.kind === 'exchange_in'
                  ? 'text-success'
                  : 'text-fg'}"
              >
                {m.kind === 'exchange_in' ? '+' : '−'}{formatEur(m.amount_cents)}
              </p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Stueckelung -->
    <section class="mt-10 grid gap-4 md:grid-cols-2">
      <details class="card p-6" open={!open}>
        <summary class="cursor-pointer font-medium text-fg">
          {t('Startbestand', 'Starting float')}
        </summary>
        <div class="mt-4"><DenominationList counts={startCounts} /></div>
      </details>
      {#if !open}
        <details class="card p-6" open>
          <summary class="cursor-pointer font-medium text-fg">
            {t('Endbestand', 'Closing float')}
          </summary>
          <div class="mt-4"><DenominationList counts={endCounts} /></div>
        </details>
      {/if}
    </section>
  {/if}
</div>

<style>
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--radius-lg, 1rem);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .seg button {
    flex: 1 1 auto;
    padding: 0.6rem 0.85rem;
    border-radius: var(--radius-md, 0.75rem);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
</style>
