<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import {
    STATUS_LABELS,
    artistCosts,
    compareArtists,
    editionDays,
    editionCosts,
    formatDay,
    formatMoney,
    openChecks,
    type Artist,
    type ArtistStatus,
    type BookingItem,
    type Edition,
  } from '$lib/booking';
  import CheckChips from '$lib/booking/CheckChips.svelte';
  import EditionForm from '$lib/booking/EditionForm.svelte';

  const RES = CREW_RESOURCES.booking;
  const EDITION_KEY = 'platform.booking.edition';

  let editions = $state<Edition[]>([]);
  let editionId = $state('');
  let artists = $state<Artist[]>([]);
  let items = $state<BookingItem[]>([]);
  let loading = $state(true);
  let loadingArtists = $state(false);
  let errorMsg = $state<string | null>(null);

  let filter = $state<'all' | 'open' | ArtistStatus>('all');
  let search = $state('');

  // Formulare
  let showEditionForm = $state(false);
  let editingEdition = $state<Edition | null>(null);

  let newArtistName = $state('');
  let newArtistStatus = $state<ArtistStatus>('idee');
  let creatingArtist = $state(false);

  const canWrite = $derived(auth.canWrite(RES));
  const edition = $derived(editions.find((e) => e.id === editionId) ?? null);
  const currency = $derived(edition?.currency || 'EUR');

  const itemsByArtist = $derived.by(() => {
    const map: Record<string, BookingItem[]> = {};
    for (const i of items) (map[i.artist] ??= []).push(i);
    return map;
  });

  const rows = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return artists
      .filter((a) => {
        if (q && !`${a.name} ${a.agency} ${a.stage}`.toLowerCase().includes(q)) return false;
        if (filter === 'all') return true;
        if (filter === 'open')
          return a.status !== 'abgesagt' && openChecks(a, itemsByArtist[a.id] ?? []) > 0;
        return a.status === filter;
      })
      .sort(compareArtists)
      .map((a) => ({
        artist: a,
        items: itemsByArtist[a.id] ?? [],
        costs: artistCosts(a, itemsByArtist[a.id] ?? []),
        open: a.status === 'abgesagt' ? 0 : openChecks(a, itemsByArtist[a.id] ?? []),
      }));
  });

  const totals = $derived(editionCosts(artists, items));
  const confirmedCount = $derived(artists.filter((a) => a.status === 'bestaetigt').length);
  const openTotal = $derived(
    artists
      .filter((a) => a.status !== 'abgesagt')
      .reduce((s, a) => s + openChecks(a, itemsByArtist[a.id] ?? []), 0),
  );
  const budgetPct = $derived(
    edition && edition.budget > 0 ? Math.min(100, (totals.total / edition.budget) * 100) : null,
  );

  onMount(() => void loadEditions());

  async function loadEditions() {
    if (!auth.pb || !auth.canRead(RES)) {
      loading = false;
      return;
    }
    loading = true;
    errorMsg = null;
    try {
      editions = (await auth.pb
        .collection('booking_editions')
        .getFullList({ sort: '-year,-created' })) as unknown as Edition[];
      let stored = '';
      try {
        stored = localStorage.getItem(EDITION_KEY) ?? '';
      } catch {
        // Private Mode
      }
      const pick =
        editions.find((e) => e.id === stored) ?? editions.find((e) => !e.archived) ?? editions[0];
      if (pick) await selectEdition(pick.id);
    } catch (err) {
      console.error('[booking] editions failed', err);
      errorMsg = errorMessage(err, 'Editionen konnten nicht geladen werden.');
    } finally {
      loading = false;
    }
  }

  async function selectEdition(id: string) {
    editionId = id;
    try {
      localStorage.setItem(EDITION_KEY, id);
    } catch {
      // Private Mode
    }
    await loadArtists();
  }

  async function loadArtists() {
    if (!auth.pb || !editionId) return;
    loadingArtists = true;
    errorMsg = null;
    try {
      const [a, i] = await Promise.all([
        auth.pb
          .collection('booking_artists')
          .getFullList({ filter: auth.pb.filter('edition = {:e}', { e: editionId }) }),
        auth.pb
          .collection('booking_items')
          .getFullList({ filter: auth.pb.filter('artist.edition = {:e}', { e: editionId }) }),
      ]);
      artists = a as unknown as Artist[];
      items = i as unknown as BookingItem[];
    } catch (err) {
      console.error('[booking] artists failed', err);
      errorMsg = errorMessage(err, 'Artists konnten nicht geladen werden.');
    } finally {
      loadingArtists = false;
    }
  }

  function openEditionForm(existing: Edition | null) {
    editingEdition = existing;
    showEditionForm = true;
  }

  async function editionSaved(rec: Edition, isNew: boolean) {
    showEditionForm = false;
    if (isNew) {
      editions = [rec, ...editions].sort((a, b) => b.year - a.year);
      await selectEdition(rec.id);
    } else {
      editions = editions.map((e) => (e.id === rec.id ? rec : e));
    }
  }

  async function createArtist(event: SubmitEvent) {
    event.preventDefault();
    if (!auth.pb || !canWrite || !editionId || !newArtistName.trim()) return;
    creatingArtist = true;
    errorMsg = null;
    try {
      const rec = await auth.pb.collection('booking_artists').create({
        edition: editionId,
        // Eintaegiges Event: Tag direkt setzen.
        day: editionDays(edition).length === 1 ? editionDays(edition)[0] : '',
        name: newArtistName.trim(),
        status: newArtistStatus,
        not_needed: [],
      });
      newArtistName = '';
      await goto(`/crew/booking/${rec.id}`);
    } catch (err) {
      errorMsg = errorMessage(err, 'Artist konnte nicht angelegt werden.');
    } finally {
      creatingArtist = false;
    }
  }

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'open', label: 'Offene Punkte' },
    { key: 'idee', label: 'Idee' },
    { key: 'anfrage', label: 'Anfrage' },
    { key: 'angebot', label: 'Angebot' },
    { key: 'bestaetigt', label: 'Bestaetigt' },
    { key: 'abgesagt', label: 'Abgesagt' },
  ];

  function slot(a: Artist): string {
    const day = formatDay(a.day);
    const time = a.slot_start ? `${a.slot_start}${a.slot_end ? `–${a.slot_end}` : ''}` : '';
    return [day, time].filter(Boolean).join(' · ') || '–';
  }
</script>

<svelte:head>
  <title>DJ-Planung</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
  <a href="/crew" class="text-sm text-fg-muted hover:text-fg">← Crew-Bereich</a>
  <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">DJ-Planung</h1>
      <p class="mt-2 text-fg-muted">Gagen, Rider, Reise und Hotel pro Edition.</p>
    </div>
    {#if editions.length > 0}
      <div class="flex flex-wrap items-center gap-2">
        <label class="sr-only" for="edition">Edition</label>
        <select
          id="edition"
          class="field w-auto"
          value={editionId}
          onchange={(e) => void selectEdition((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each editions as e (e.id)}
            <option value={e.id}>{e.name}{e.archived ? ' (archiviert)' : ''}</option>
          {/each}
        </select>
        {#if canWrite}
          <Button
            variant="ghost"
            onclick={() => {
              openEditionForm(edition);
            }}>Bearbeiten</Button
          >
          <Button
            variant="ghost"
            onclick={() => {
              openEditionForm(null);
            }}>Neue Edition</Button
          >
        {/if}
      </div>
    {/if}
  </div>

  {#if errorMsg}
    <p class="mt-6 text-sm text-danger" role="alert">{errorMsg}</p>
  {/if}

  {#if !auth.canRead(RES)}
    <div class="card mt-8 p-6">
      <p class="font-medium text-fg">Kein Zugriff</p>
      <p class="mt-2 text-sm text-fg-muted">
        Fuer die DJ-Planung brauchst du das Recht „DJ-Planung“. Ein Admin kann es dir geben.
      </p>
      <div class="mt-4"><Button href="/crew" variant="ghost">Zurueck</Button></div>
    </div>
  {:else if loading}
    <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
  {:else}
    {#if showEditionForm}
      {#key editingEdition?.id ?? 'neu'}
        <EditionForm
          edition={editingEdition}
          onSaved={(rec, isNew) => void editionSaved(rec, isNew)}
          onCancel={() => (showEditionForm = false)}
        />
      {/key}
    {/if}

    {#if editions.length === 0}
      <div class="card mt-8 p-6">
        <p class="font-medium text-fg">Noch keine Edition</p>
        <p class="mt-2 text-sm text-fg-muted">
          Lege zuerst eine Edition an (z. B. „Energize 2027“). Darin planst du dann die Artists.
        </p>
        {#if canWrite && !showEditionForm}
          <div class="mt-4">
            <Button onclick={() => openEditionForm(null)}>Edition anlegen</Button>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Kennzahlen -->
      <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Kosten">
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Gesamtkosten</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">
            {formatMoney(totals.total, currency)}
          </p>
          {#if budgetPct !== null && edition}
            <div class="budget mt-3" aria-hidden="true">
              <span style="width: {budgetPct}%" class:over={totals.total > edition.budget}></span>
            </div>
            <p class="mt-1 text-xs text-fg-muted">
              von {formatMoney(edition.budget, currency)} Budget
              {#if totals.total > edition.budget}
                · <span class="text-danger"
                  >{formatMoney(totals.total - edition.budget, currency)} drueber</span
                >
              {/if}
            </p>
          {/if}
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Gagen</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">
            {formatMoney(totals.fee, currency)}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            {confirmedCount} bestaetigt · {artists.length} gesamt
          </p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Reise, Hotel, Transfer, Extras</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">
            {formatMoney(
              totals.anreise + totals.hotel + totals.transfer + totals.zusatzkosten,
              currency,
            )}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            Hotel {formatMoney(totals.hotel, currency)} · Anreise {formatMoney(
              totals.anreise,
              currency,
            )}
          </p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Offene Punkte</p>
          <p
            class="mt-1 text-2xl font-semibold tabular-nums"
            class:text-success={openTotal === 0}
            class:text-fg={openTotal > 0}
          >
            {openTotal}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            bezahlt {formatMoney(totals.paid, currency)}
          </p>
        </div>
      </section>

      <!-- Filter + neuer Artist -->
      <div class="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="seg" role="group" aria-label="Filter">
          {#each FILTERS as f (f.key)}
            <button
              type="button"
              class:on={filter === f.key}
              aria-pressed={filter === f.key}
              onclick={() => (filter = f.key)}>{f.label}</button
            >
          {/each}
        </div>
        <input
          class="field lg:max-w-xs"
          type="search"
          placeholder="Suchen (Name, Agentur, Stage)"
          bind:value={search}
        />
      </div>

      {#if canWrite}
        <form
          onsubmit={createArtist}
          class="card mt-4 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
        >
          <input
            class="field"
            placeholder="Neuer Artist, z. B. DJ Name"
            bind:value={newArtistName}
            maxlength="160"
            required
          />
          <select class="field" bind:value={newArtistStatus}>
            {#each Object.entries(STATUS_LABELS) as [key, label] (key)}
              <option value={key}>{label}</option>
            {/each}
          </select>
          <Button type="submit" disabled={creatingArtist || !newArtistName.trim()}>
            {creatingArtist ? 'Legt an …' : 'Anlegen'}
          </Button>
        </form>
      {/if}

      <!-- Liste -->
      {#if loadingArtists}
        <div class="card mt-4 h-40 animate-pulse opacity-50"></div>
      {:else if rows.length === 0}
        <div class="card mt-4 p-6 text-sm text-fg-muted">
          {artists.length === 0 ? 'Noch keine Artists in dieser Edition.' : 'Keine Treffer.'}
        </div>
      {:else}
        <ul class="mt-4 flex flex-col gap-2">
          {#each rows as row (row.artist.id)}
            <li>
              <a
                href="/crew/booking/{row.artist.id}"
                class="card card-press row"
                class:cancelled={row.artist.status === 'abgesagt'}
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="truncate font-semibold text-fg">{row.artist.name}</span>
                    <span class="status status-{row.artist.status}"
                      >{STATUS_LABELS[row.artist.status]}</span
                    >
                  </div>
                  <p class="mt-1 text-xs text-fg-muted">
                    {slot(row.artist)}{row.artist.stage ? ` · ${row.artist.stage}` : ''}{row.artist
                      .agency
                      ? ` · ${row.artist.agency}`
                      : ''}
                  </p>
                </div>
                <div class="chips-col">
                  {#if row.artist.status !== 'abgesagt'}
                    <CheckChips artist={row.artist} items={row.items} />
                  {/if}
                </div>
                <div class="money">
                  <span class="text-sm font-semibold text-fg tabular-nums"
                    >{formatMoney(row.costs.total, currency)}</span
                  >
                  <span class="text-xs text-fg-muted tabular-nums"
                    >Gage {formatMoney(row.costs.fee, currency)}</span
                  >
                </div>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem 1.15rem;
    text-decoration: none;
    border-radius: var(--radius-lg);
  }
  @media (min-width: 900px) {
    .row {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.3fr) 9rem;
      align-items: center;
    }
  }
  .money {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 900px) {
    .money {
      align-items: flex-end;
    }
  }
  .cancelled {
    opacity: 0.55;
  }
  .status {
    padding: 0.05rem 0.5rem;
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid var(--glass-border);
    color: var(--color-fg-muted);
  }
  .status-bestaetigt {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  .status-idee {
    border-style: dashed;
  }
  .status-angebot {
    color: var(--color-accent);
    border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  }
  .status-abgesagt {
    color: var(--color-danger);
    border-color: color-mix(in srgb, var(--color-danger) 45%, transparent);
  }
  .budget {
    height: 0.4rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg-strong);
    overflow: hidden;
  }
  .budget span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background-color: var(--color-accent);
  }
  .budget span.over {
    background-color: var(--color-danger);
  }
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .seg button {
    padding: 0.35rem 0.8rem;
    border-radius: var(--radius-pill);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    background: transparent;
    cursor: pointer;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
</style>
