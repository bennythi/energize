<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import {
    editionCosts,
    formatMoney,
    type Artist,
    type BookingItem,
    type Edition,
  } from '$lib/booking';
  import {
    CATEGORIES,
    HARDSTYLE_TEMPLATE,
    PRICING_LABELS,
    STATUS_LABELS,
    formula,
    groupByCategory,
    itemAmount,
    planDays,
    presetDays,
    summarize,
    type CostItem,
    type CostStatus,
    type Pricing,
  } from '$lib/costs';
  import EditionForm from '$lib/booking/EditionForm.svelte';

  const RES = CREW_RESOURCES.kosten;
  const EDITION_KEY = 'platform.booking.edition';

  let editions = $state<Edition[]>([]);
  let editionId = $state('');
  let items = $state<CostItem[]>([]);
  let artistTotal = $state<number | null>(null);
  let loading = $state(true);
  let loadingItems = $state(false);
  let errorMsg = $state<string | null>(null);
  let notice = $state<string | null>(null);

  let filter = $state<'alle' | 'unbezahlt' | CostStatus>('alle');
  let search = $state('');
  let collapsed = $state<Record<string, boolean>>({});

  let showEditionForm = $state(false);
  let editingEdition = $state<Edition | null>(null);
  let loadingTemplate = $state(false);

  // Neue Position (pro Kategorie aufklappbar)
  let addingIn = $state<string | null>(null);
  let newTitle = $state('');
  let newPricing = $state<Pricing>('pauschal');
  let creating = $state(false);

  const canWrite = $derived(auth.canWrite(RES));
  const edition = $derived(editions.find((e) => e.id === editionId) ?? null);
  const currency = $derived(edition?.currency || 'EUR');
  const money = (v: number) => formatMoney(v, currency);

  const summary = $derived(summarize(items));
  const grandTotal = $derived(summary.planned + (artistTotal ?? 0));
  const budgetPct = $derived(
    edition && edition.total_budget > 0
      ? Math.min(100, (grandTotal / edition.total_budget) * 100)
      : null,
  );
  const withoutPrice = $derived(
    items.filter((i) => i.status !== 'abgesagt' && itemAmount(i) === 0).length,
  );

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !`${i.title} ${i.supplier} ${i.notes}`.toLowerCase().includes(q)) return false;
      if (filter === 'alle') return true;
      if (filter === 'unbezahlt') return i.status === 'beauftragt' && !i.paid;
      return i.status === filter;
    });
  });
  const groups = $derived(groupByCategory(filtered));

  onMount(() => void loadEditions());

  async function loadEditions() {
    if (!auth.pb || !auth.canRead(RES)) {
      loading = false;
      return;
    }
    loading = true;
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
    await loadItems();
  }

  async function loadItems() {
    if (!auth.pb || !editionId) return;
    loadingItems = true;
    errorMsg = null;
    try {
      items = (await auth.pb.collection('cost_items').getFullList({
        filter: auth.pb.filter('edition = {:e}', { e: editionId }),
        sort: 'category,sort,title',
      })) as unknown as CostItem[];
      // Artist-Kosten aus der DJ-Planung, falls man sie sehen darf.
      if (auth.canRead(CREW_RESOURCES.booking)) {
        const [a, b] = await Promise.all([
          auth.pb
            .collection('booking_artists')
            .getFullList({ filter: auth.pb.filter('edition = {:e}', { e: editionId }) }),
          auth.pb
            .collection('booking_items')
            .getFullList({ filter: auth.pb.filter('artist.edition = {:e}', { e: editionId }) }),
        ]);
        artistTotal = editionCosts(a as unknown as Artist[], b as unknown as BookingItem[]).total;
      } else {
        artistTotal = null;
      }
    } catch (err) {
      errorMsg = errorMessage(err, 'Kosten konnten nicht geladen werden.');
    } finally {
      loadingItems = false;
    }
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

  async function loadTemplate() {
    if (!auth.pb || !edition || !canWrite) return;
    if (
      items.length > 0 &&
      !confirm('Die Vorlage fuegt alle Positionen zusaetzlich hinzu. Fortfahren?')
    )
      return;
    loadingTemplate = true;
    errorMsg = null;
    const days = planDays(edition);
    try {
      const res = await auth.pb.send<{ created: number }>('/api/crew/cost-template', {
        method: 'POST',
        body: {
          edition: edition.id,
          items: HARDSTYLE_TEMPLATE.map((t) => ({ ...t, days: presetDays(t.days, days) })),
        },
      });
      notice = `${res.created} Positionen aus der Vorlage angelegt. Preise kommen aus den Angeboten.`;
      await loadItems();
    } catch (err) {
      errorMsg = errorMessage(err, 'Vorlage konnte nicht geladen werden.');
    } finally {
      loadingTemplate = false;
    }
  }

  function startAdd(category: string) {
    addingIn = category;
    newTitle = '';
    newPricing = 'pauschal';
  }

  async function createItem(event: SubmitEvent, category: string) {
    event.preventDefault();
    if (!auth.pb || !edition || !newTitle.trim()) return;
    creating = true;
    try {
      const rec = await auth.pb.collection('cost_items').create({
        edition: edition.id,
        category,
        title: newTitle.trim(),
        pricing: newPricing,
        quantity: newPricing === 'pauschal' ? 0 : 1,
        hours: newPricing === 'stunden' ? 8 : 0,
        unit_price: 0,
        days:
          newPricing === 'stunden' || newPricing === 'pro_tag'
            ? presetDays('festival', planDays(edition))
            : [],
        status: 'offen',
        paid: false,
        sort: 999,
      });
      await goto(`/crew/kosten/${rec.id}`);
    } catch (err) {
      errorMsg = errorMessage(err, 'Position konnte nicht angelegt werden.');
    } finally {
      creating = false;
    }
  }

  function exportCsv() {
    const rows = [
      [
        'Kategorie',
        'Position',
        'Lieferant',
        'Abrechnung',
        'Rechnung',
        'Betrag',
        'Status',
        'Bezahlt',
        'Notizen',
      ],
      ...groupByCategory(items).flatMap((g) =>
        g.items.map((i) => [
          g.label,
          i.title,
          i.supplier,
          PRICING_LABELS[i.pricing],
          formula(i, money),
          itemAmount(i).toFixed(2).replace('.', ','),
          STATUS_LABELS[i.status],
          i.paid ? 'ja' : 'nein',
          i.notes.replace(/\s+/g, ' '),
        ]),
      ),
    ];
    if (artistTotal !== null)
      rows.push([
        'Artists',
        'Gagen, Reise, Hotel (DJ-Planung)',
        '',
        '',
        '',
        artistTotal.toFixed(2).replace('.', ','),
        '',
        '',
        '',
      ]);
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kostenplanung-${edition?.name ?? 'edition'}.csv`.replace(/\s+/g, '-');
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'alle', label: 'Alle' },
    { key: 'offen', label: 'Offen' },
    { key: 'angefragt', label: 'Angefragt' },
    { key: 'angebot', label: 'Angebot da' },
    { key: 'beauftragt', label: 'Beauftragt' },
    { key: 'unbezahlt', label: 'Noch nicht bezahlt' },
  ];

  function groupSum(list: CostItem[]): number {
    return list.filter((i) => i.status !== 'abgesagt').reduce((s, i) => s + itemAmount(i), 0);
  }
</script>

<svelte:head>
  <title>Kostenplanung</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
  <a href="/crew" class="text-sm text-fg-muted hover:text-fg">← Crew-Bereich</a>
  <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Kostenplanung</h1>
      <p class="mt-2 text-fg-muted">
        Alle Festivalkosten pro Edition, mit Angeboten und Lieferanten.
      </p>
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
              editingEdition = edition;
              showEditionForm = true;
            }}>Bearbeiten</Button
          >
          <Button
            variant="ghost"
            onclick={() => {
              editingEdition = null;
              showEditionForm = true;
            }}>Neue Edition</Button
          >
        {/if}
      </div>
    {/if}
  </div>

  {#if errorMsg}<p class="mt-6 text-sm text-danger" role="alert">{errorMsg}</p>{/if}
  {#if notice}<p class="mt-6 text-sm text-success" role="status">{notice}</p>{/if}

  {#if !auth.canRead(RES)}
    <div class="card mt-8 p-6">
      <p class="font-medium text-fg">Kein Zugriff</p>
      <p class="mt-2 text-sm text-fg-muted">
        Fuer die Kostenplanung brauchst du das Recht „Kostenplanung“. Ein Admin kann es dir geben.
      </p>
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
          Lege zuerst eine Edition mit Festivaltagen, Auf- und Abbautagen an.
        </p>
        {#if canWrite && !showEditionForm}
          <div class="mt-4">
            <Button onclick={() => (showEditionForm = true)}>Edition anlegen</Button>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Kennzahlen -->
      <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summen">
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Gesamtkosten geplant</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">{money(grandTotal)}</p>
          {#if budgetPct !== null && edition}
            <div class="budget mt-3" aria-hidden="true">
              <span style="width: {budgetPct}%" class:over={grandTotal > edition.total_budget}
              ></span>
            </div>
            <p class="mt-1 text-xs text-fg-muted">
              von {money(edition.total_budget)} Budget
              {#if grandTotal > edition.total_budget}
                · <span class="text-danger">{money(grandTotal - edition.total_budget)} drueber</span
                >
              {:else}
                · {money(edition.total_budget - grandTotal)} frei
              {/if}
            </p>
          {:else}
            <p class="mt-1 text-xs text-fg-muted">Gesamtbudget unter „Bearbeiten“ eintragen</p>
          {/if}
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Beauftragt</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">
            {money(summary.commissioned)}
          </p>
          <p class="mt-1 text-xs text-fg-muted">noch offen {money(summary.open)}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Bezahlt</p>
          <p class="mt-1 text-2xl font-semibold text-success tabular-nums">{money(summary.paid)}</p>
          <p class="mt-1 text-xs text-fg-muted">ohne Artists</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-medium text-fg-muted">Artists (DJ-Planung)</p>
          <p class="mt-1 text-2xl font-semibold text-fg tabular-nums">
            {artistTotal === null ? '–' : money(artistTotal)}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            {#if artistTotal === null}kein Zugriff auf die DJ-Planung{:else}<a
                href="/crew/booking"
                class="text-accent hover:underline">Gagen, Reise, Hotel →</a
              >{/if}
          </p>
        </div>
      </section>

      {#if withoutPrice > 0 && items.length > 0}
        <p class="mt-4 text-sm text-fg-muted">
          {withoutPrice} Position{withoutPrice === 1 ? '' : 'en'} noch ohne Preis.
        </p>
      {/if}

      {#if loadingItems}
        <div class="card mt-6 h-40 animate-pulse opacity-50"></div>
      {:else if items.length === 0}
        <div class="card mt-8 p-6">
          <p class="font-medium text-fg">Noch keine Positionen</p>
          <p class="mt-2 text-sm text-fg-muted">
            Starte mit der Vorlage fuer ein Hardstyle-Festival ({HARDSTYLE_TEMPLATE.length} Positionen
            in {CATEGORIES.length} Kategorien: Security, Stage-Hands, Verkehr, Toiletten, SFX, Sanitaet,
            Strom, Zaeune, Abgaben …). Mengen und Tage sind vorbelegt, Preise traegst du ueber die Angebote
            ein. Oder lege Positionen einzeln an.
          </p>
          {#if canWrite}
            <div class="mt-4 flex flex-wrap gap-3">
              <Button onclick={() => void loadTemplate()} disabled={loadingTemplate}>
                {loadingTemplate ? 'Lege an …' : 'Vorlage Hardstyle-Festival laden'}
              </Button>
              <Button variant="ghost" onclick={() => startAdd('sonstiges')}>Einzeln anlegen</Button>
            </div>
          {/if}
        </div>
      {/if}

      {#if items.length > 0 || addingIn}
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
          <div class="flex gap-2">
            <input
              class="field lg:w-64"
              type="search"
              placeholder="Suchen (Position, Lieferant)"
              bind:value={search}
            />
            <Button variant="ghost" onclick={exportCsv}>CSV</Button>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-4">
          {#each groups as g (g.key)}
            {@const open = !collapsed[g.key]}
            <section class="card overflow-hidden">
              <button
                type="button"
                class="group-head"
                aria-expanded={open}
                onclick={() => (collapsed = { ...collapsed, [g.key]: open })}
              >
                <span class="font-semibold text-fg">{g.label}</span>
                <span class="text-xs text-fg-muted">{g.items.length}</span>
                <span class="ml-auto font-semibold text-fg tabular-nums"
                  >{money(groupSum(g.items))}</span
                >
                <span class="chev" class:rot={open} aria-hidden="true">▸</span>
              </button>
              {#if open}
                <ul>
                  {#each g.items as i (i.id)}
                    <li>
                      <a
                        href="/crew/kosten/{i.id}"
                        class="row"
                        class:struck={i.status === 'abgesagt'}
                      >
                        <div class="min-w-0">
                          <p class="truncate font-medium text-fg">{i.title}</p>
                          <p class="truncate text-xs text-fg-muted">
                            {i.supplier || 'kein Lieferant'} · {formula(i, money)}
                          </p>
                        </div>
                        <span class="status status-{i.status}">{STATUS_LABELS[i.status]}</span>
                        <span class="amount tabular-nums" class:muted={itemAmount(i) === 0}>
                          {money(itemAmount(i))}
                          {#if i.paid}<span class="paid" title="bezahlt">✓</span>{/if}
                        </span>
                      </a>
                    </li>
                  {/each}
                </ul>
                {#if canWrite}
                  {#if addingIn === g.key}
                    <form class="add" onsubmit={(e) => void createItem(e, g.key)}>
                      <input
                        class="field"
                        placeholder="Neue Position"
                        bind:value={newTitle}
                        required
                        maxlength="200"
                      />
                      <select class="field" bind:value={newPricing}>
                        {#each Object.entries(PRICING_LABELS) as [k, label] (k)}
                          <option value={k}>{label}</option>
                        {/each}
                      </select>
                      <Button type="submit" disabled={creating}>Anlegen</Button>
                      <Button variant="ghost" onclick={() => (addingIn = null)}>Abbrechen</Button>
                    </form>
                  {:else}
                    <button type="button" class="add-link" onclick={() => startAdd(g.key)}
                      >+ Position</button
                    >
                  {/if}
                {/if}
              {/if}
            </section>
          {/each}
        </div>

        {#if canWrite}
          <div class="mt-6 flex flex-wrap items-center gap-3">
            <label class="sr-only" for="newcat">Kategorie</label>
            <select
              id="newcat"
              class="field w-auto"
              onchange={(e) => {
                const v = (e.currentTarget as HTMLSelectElement).value;
                if (v) startAdd(v);
                (e.currentTarget as HTMLSelectElement).value = '';
              }}
            >
              <option value="">+ Position in Kategorie …</option>
              {#each CATEGORIES as c (c.key)}
                <option value={c.key}>{c.label}</option>
              {/each}
            </select>
            {#if addingIn && !groups.some((g) => g.key === addingIn)}
              <form class="add flex-1" onsubmit={(e) => void createItem(e, addingIn!)}>
                <input
                  class="field"
                  placeholder="Neue Position"
                  bind:value={newTitle}
                  required
                  maxlength="200"
                />
                <select class="field" bind:value={newPricing}>
                  {#each Object.entries(PRICING_LABELS) as [k, label] (k)}
                    <option value={k}>{label}</option>
                  {/each}
                </select>
                <Button type="submit" disabled={creating}>Anlegen</Button>
              </form>
            {/if}
            {#if items.length > 0}
              <Button
                variant="ghost"
                onclick={() => void loadTemplate()}
                disabled={loadingTemplate}
              >
                Vorlage zusaetzlich laden
              </Button>
            {/if}
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
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
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
  .group-head {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 1.15rem;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  .chev {
    color: var(--color-fg-muted);
    transition: transform var(--dur-hover) var(--ease-out);
  }
  .chev.rot {
    transform: rotate(90deg);
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.4rem 0.9rem;
    align-items: center;
    padding: 0.7rem 1.15rem;
    border-top: 1px solid var(--glass-border);
    text-decoration: none;
    transition: background-color var(--dur-hover) var(--ease-out);
  }
  @media (min-width: 720px) {
    .row {
      grid-template-columns: minmax(0, 1fr) 9.5rem 8.5rem;
    }
  }
  @media (hover: hover) and (pointer: fine) {
    .row:hover {
      background-color: var(--glass-bg);
    }
  }
  .struck {
    opacity: 0.5;
  }
  .struck p:first-child {
    text-decoration: line-through;
  }
  .amount {
    text-align: right;
    font-weight: 600;
    color: var(--color-fg);
  }
  .amount.muted {
    color: var(--color-fg-muted);
    font-weight: 400;
  }
  .paid {
    margin-left: 0.3rem;
    color: var(--color-success);
  }
  .status {
    justify-self: start;
    padding: 0.05rem 0.55rem;
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid var(--glass-border);
    color: var(--color-fg-muted);
    white-space: nowrap;
  }
  .status-angefragt {
    border-style: dashed;
    color: var(--color-fg);
  }
  .status-angebot {
    color: var(--color-accent);
    border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  }
  .status-beauftragt {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  .status-abgesagt {
    color: var(--color-danger);
  }
  .add {
    display: grid;
    gap: 0.5rem;
    padding: 0.8rem 1.15rem;
    border-top: 1px solid var(--glass-border);
  }
  @media (min-width: 720px) {
    .add {
      grid-template-columns: minmax(0, 1fr) 12rem auto auto;
      align-items: center;
    }
  }
  .add-link {
    display: block;
    width: 100%;
    padding: 0.6rem 1.15rem;
    border-top: 1px solid var(--glass-border);
    font-size: 0.85rem;
    color: var(--color-accent);
    text-align: left;
    background: transparent;
    cursor: pointer;
  }
</style>
