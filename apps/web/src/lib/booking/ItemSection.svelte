<script lang="ts">
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { errorMessage } from '$lib/crew-api';
  import {
    KIND_FIELDS,
    KIND_LABELS,
    formatDateTime,
    formatMoney,
    type BookingItem,
    type CheckState,
    type ItemKind,
  } from '$lib/booking';

  interface Props {
    artistId: string;
    kind: ItemKind;
    items: BookingItem[];
    currency: string;
    canWrite: boolean;
    canDelete: boolean;
    /** Checkpunkt-Status (nur fuer anreise/hotel/transfer). */
    check?: CheckState;
    /** "Nicht noetig" umschalten (nur fuer anreise/hotel/transfer). */
    onToggleNotNeeded?: () => void;
    onChange: () => void;
  }
  let {
    artistId,
    kind,
    items,
    currency,
    canWrite,
    canDelete,
    check,
    onToggleNotNeeded,
    onChange,
  }: Props = $props();

  const f = $derived(KIND_FIELDS[kind]);
  const sum = $derived(items.reduce((s, i) => s + (i.cost || 0), 0));

  type Draft = Omit<BookingItem, 'id' | 'artist' | 'kind'>;
  const empty = (): Draft => ({
    title: '',
    provider: '',
    start_at: '',
    end_at: '',
    location: '',
    reference: '',
    persons: 1,
    cost: 0,
    booked: false,
    paid: false,
    notes: '',
  });

  let editingId = $state<string | 'new' | null>(null);
  let draft = $state<Draft>(empty());
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);

  function startNew() {
    draft = empty();
    editingId = 'new';
    errorMsg = null;
  }
  function startEdit(i: BookingItem) {
    draft = {
      title: i.title,
      provider: i.provider,
      start_at: i.start_at,
      end_at: i.end_at,
      location: i.location,
      reference: i.reference,
      persons: i.persons,
      cost: i.cost,
      booked: i.booked,
      paid: i.paid,
      notes: i.notes,
    };
    editingId = i.id;
    errorMsg = null;
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!auth.pb || !canWrite) return;
    saving = true;
    errorMsg = null;
    const data = { ...draft, cost: Number(draft.cost) || 0, persons: Number(draft.persons) || 0 };
    try {
      if (editingId === 'new') {
        await auth.pb.collection('booking_items').create({ ...data, artist: artistId, kind });
      } else if (editingId) {
        await auth.pb.collection('booking_items').update(editingId, data);
      }
      editingId = null;
      onChange();
    } catch (err) {
      errorMsg = errorMessage(err, 'Speichern fehlgeschlagen.');
    } finally {
      saving = false;
    }
  }

  async function toggle(i: BookingItem, field: 'booked' | 'paid') {
    if (!auth.pb || !canWrite) return;
    try {
      await auth.pb.collection('booking_items').update(i.id, { [field]: !i[field] });
      onChange();
    } catch (err) {
      errorMsg = errorMessage(err, 'Aendern fehlgeschlagen.');
    }
  }

  async function remove(i: BookingItem) {
    if (!auth.pb || !canDelete) return;
    if (!confirm(`„${i.title}“ wirklich loeschen?`)) return;
    try {
      await auth.pb.collection('booking_items').delete(i.id);
      onChange();
    } catch (err) {
      errorMsg = errorMessage(err, 'Loeschen fehlgeschlagen.');
    }
  }

  function when(i: BookingItem): string {
    const a = formatDateTime(i.start_at);
    const b = formatDateTime(i.end_at);
    if (a && b) return `${a} → ${b}`;
    return a || b;
  }
</script>

<section class="card p-5 md:p-6" aria-labelledby="sec-{kind}">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <h2 id="sec-{kind}" class="text-lg font-semibold text-fg">{KIND_LABELS[kind]}</h2>
      {#if check === 'done'}
        <span class="pill pill-done">gebucht</span>
      {:else if check === 'open'}
        <span class="pill">offen</span>
      {:else if check === 'na'}
        <span class="pill pill-na">nicht noetig</span>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      {#if sum > 0}
        <span class="text-sm text-fg-muted tabular-nums">{formatMoney(sum, currency)}</span>
      {/if}
      {#if canWrite && onToggleNotNeeded}
        <button type="button" class="link" onclick={onToggleNotNeeded}>
          {check === 'na' ? 'Doch noetig' : 'Nicht noetig'}
        </button>
      {/if}
    </div>
  </header>

  {#if check !== 'na'}
    {#if items.length > 0}
      <ul class="mt-4 flex flex-col gap-2">
        {#each items as i (i.id)}
          <li class="item">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-fg">
                {i.title}
                {#if i.provider}<span class="text-fg-muted"> · {i.provider}</span>{/if}
              </p>
              <p class="mt-0.5 text-xs text-fg-muted">
                {[
                  when(i),
                  i.location,
                  i.reference ? `Nr. ${i.reference}` : '',
                  i.persons > 1 ? `${i.persons} Pers.` : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || '–'}
              </p>
              {#if i.notes}
                <p class="mt-1 whitespace-pre-wrap text-xs text-fg-muted">{i.notes}</p>
              {/if}
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium text-fg tabular-nums"
                >{formatMoney(i.cost || 0, currency)}</span
              >
              <button
                type="button"
                class="tog"
                class:tog-on={i.booked}
                disabled={!canWrite}
                aria-pressed={i.booked}
                onclick={() => void toggle(i, 'booked')}
                >{i.booked ? 'Gebucht' : 'Nicht gebucht'}</button
              >
              <button
                type="button"
                class="tog"
                class:tog-on={i.paid}
                disabled={!canWrite}
                aria-pressed={i.paid}
                onclick={() => void toggle(i, 'paid')}>{i.paid ? 'Bezahlt' : 'Offen'}</button
              >
              {#if canWrite}
                <button type="button" class="link" onclick={() => startEdit(i)}>Bearbeiten</button>
              {/if}
              {#if canDelete}
                <button type="button" class="link link-danger" onclick={() => void remove(i)}
                  >Loeschen</button
                >
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {:else if editingId !== 'new'}
      <p class="mt-3 text-sm text-fg-muted">Noch nichts eingetragen.</p>
    {/if}

    {#if editingId}
      <form onsubmit={save} class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="block sm:col-span-2">
          <span class="text-xs font-medium text-fg-muted">Bezeichnung</span>
          <input
            class="field mt-1"
            bind:value={draft.title}
            required
            maxlength="200"
            placeholder={f.placeholder}
          />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-xs font-medium text-fg-muted">{f.provider}</span>
          <input class="field mt-1" bind:value={draft.provider} maxlength="200" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">{f.start}</span>
          <input class="field mt-1" type="datetime-local" bind:value={draft.start_at} />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">{f.end}</span>
          <input class="field mt-1" type="datetime-local" bind:value={draft.end_at} />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-xs font-medium text-fg-muted">{f.location}</span>
          <input class="field mt-1" bind:value={draft.location} maxlength="300" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">Buchungsnummer</span>
          <input class="field mt-1" bind:value={draft.reference} maxlength="120" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">Personen</span>
          <input class="field mt-1" type="number" min="0" bind:value={draft.persons} />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">Kosten ({currency})</span>
          <input class="field mt-1" type="number" min="0" step="0.01" bind:value={draft.cost} />
        </label>
        <div class="flex items-end gap-4 pb-2">
          <label class="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" bind:checked={draft.booked} /> Gebucht
          </label>
          <label class="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" bind:checked={draft.paid} /> Bezahlt
          </label>
        </div>
        <label class="block sm:col-span-2 lg:col-span-4">
          <span class="text-xs font-medium text-fg-muted">Notizen</span>
          <textarea class="field mt-1" rows="2" bind:value={draft.notes} maxlength="4000"
          ></textarea>
        </label>
        <div class="flex gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
          <Button variant="ghost" onclick={() => (editingId = null)}>Abbrechen</Button>
        </div>
      </form>
    {:else if canWrite}
      <div class="mt-4">
        <Button variant="ghost" onclick={startNew}>+ {KIND_LABELS[kind]} hinzufuegen</Button>
      </div>
    {/if}
  {/if}

  {#if errorMsg}
    <p class="mt-3 text-sm text-danger" role="alert">{errorMsg}</p>
  {/if}
</section>

<style>
  .item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-md);
    background-color: rgba(0, 0, 0, 0.18);
    border: 1px solid var(--glass-border);
  }
  .pill {
    padding: 0.05rem 0.55rem;
    border-radius: var(--radius-pill);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-fg-muted);
    border: 1px solid var(--glass-border);
  }
  .pill-done {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  .pill-na {
    opacity: 0.6;
  }
  .tog {
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    cursor: pointer;
  }
  .tog:disabled {
    cursor: default;
  }
  .tog-on {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
    background-color: color-mix(in srgb, var(--color-success) 12%, transparent);
  }
  .link {
    font-size: 0.8rem;
    color: var(--color-accent);
    background: none;
    cursor: pointer;
  }
  .link-danger {
    color: var(--color-danger);
  }
</style>
