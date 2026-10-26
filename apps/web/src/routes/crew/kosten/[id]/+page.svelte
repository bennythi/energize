<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import { formatDay, formatMoney, type Edition } from '$lib/booking';
  import {
    CATEGORIES,
    COST_STATUSES,
    PRICING_LABELS,
    STATUS_LABELS,
    categoryLabel,
    formula,
    itemAmount,
    planDays,
    type CostItem,
    type CostOffer,
    type PlanDay,
  } from '$lib/costs';

  let { data }: { data: { id: string } } = $props();

  const RES = CREW_RESOURCES.kosten;
  const canWrite = $derived(auth.canWrite(RES));
  const canDelete = $derived(auth.canDelete(RES));

  let item = $state<CostItem | null>(null);
  let edition = $state<Edition | null>(null);
  let offers = $state<CostOffer[]>([]);
  let loading = $state(true);
  let notFound = $state(false);
  let errorMsg = $state<string | null>(null);

  type Form = Omit<CostItem, 'id' | 'edition' | 'sort'>;
  let form = $state<Form | null>(null);
  let saving = $state(false);
  let savedAt = $state<number | null>(null);

  // Neues Angebot
  let showOfferForm = $state(false);
  let ofSupplier = $state('');
  let ofContact = $state('');
  let ofPrice = $state<number | null>(null);
  let ofValid = $state('');
  let ofNotes = $state('');
  let ofFile = $state<FileList | null>(null);
  let savingOffer = $state(false);
  let fileToken = $state('');

  const currency = $derived(edition?.currency || 'EUR');
  const money = (v: number) => formatMoney(v, currency);
  const days = $derived(planDays(edition));
  const needsDays = $derived(form?.pricing === 'stunden' || form?.pricing === 'pro_tag');
  const amount = $derived(form ? itemAmount(form) : 0);
  const dirty = $derived(
    !!item &&
      !!form &&
      (Object.keys(form) as (keyof Form)[]).some(
        (k) => JSON.stringify(form![k]) !== JSON.stringify(item![k]),
      ),
  );

  const PHASES: { key: PlanDay['phase']; label: string }[] = [
    { key: 'aufbau', label: 'Aufbau' },
    { key: 'festival', label: 'Festival' },
    { key: 'abbau', label: 'Abbau' },
  ];

  $effect(() => {
    void load(data.id);
  });

  async function load(id: string) {
    if (!auth.pb || !auth.canRead(RES)) {
      loading = false;
      return;
    }
    loading = true;
    try {
      const rec = (await auth.pb
        .collection('cost_items')
        .getOne(id, { expand: 'edition' })) as unknown as CostItem & {
        expand?: { edition?: Edition };
      };
      edition = rec.expand?.edition ?? null;
      setItem(rec);
      await loadOffers();
    } catch (err) {
      if ((err as { status?: number }).status === 404) notFound = true;
      else errorMsg = errorMessage(err, 'Position konnte nicht geladen werden.');
    } finally {
      loading = false;
    }
  }

  function setItem(rec: CostItem) {
    const { expand: _x, ...plain } = rec as CostItem & { expand?: unknown };
    void _x;
    item = { ...plain, days: Array.isArray(plain.days) ? plain.days : [] };
    form = {
      category: plain.category,
      title: plain.title,
      supplier: plain.supplier,
      pricing: plain.pricing,
      quantity: plain.quantity,
      hours: plain.hours,
      unit_price: plain.unit_price,
      days: Array.isArray(plain.days) ? [...plain.days] : [],
      status: plain.status,
      paid: plain.paid,
      notes: plain.notes,
    };
  }

  async function loadOffers() {
    if (!auth.pb) return;
    offers = (await auth.pb.collection('cost_offers').getFullList({
      filter: auth.pb.filter('item = {:i}', { i: data.id }),
      sort: 'unit_price,created',
    })) as unknown as CostOffer[];
  }

  async function save(event?: SubmitEvent) {
    event?.preventDefault();
    if (!auth.pb || !item || !form || !canWrite) return;
    saving = true;
    errorMsg = null;
    try {
      const rec = (await auth.pb.collection('cost_items').update(item.id, {
        ...form,
        quantity: Number(form.quantity) || 0,
        hours: Number(form.hours) || 0,
        unit_price: Number(form.unit_price) || 0,
      })) as unknown as CostItem;
      setItem(rec);
      savedAt = Date.now();
    } catch (err) {
      errorMsg = errorMessage(err, 'Speichern fehlgeschlagen.');
    } finally {
      saving = false;
    }
  }

  function toggleDay(iso: string) {
    if (!form || !canWrite) return;
    const cur = form.days ?? [];
    form.days = cur.includes(iso) ? cur.filter((d) => d !== iso) : [...cur, iso].sort();
  }

  function setPhase(phase: PlanDay['phase'], on: boolean) {
    if (!form || !canWrite) return;
    const phaseDays = days.filter((d) => d.phase === phase).map((d) => d.iso);
    const rest = (form.days ?? []).filter((d) => !phaseDays.includes(d));
    form.days = on ? [...rest, ...phaseDays].sort() : rest;
  }

  async function addOffer(event: SubmitEvent) {
    event.preventDefault();
    if (!auth.pb || !item || !canWrite || !ofSupplier.trim()) return;
    savingOffer = true;
    errorMsg = null;
    try {
      const fd = new FormData();
      fd.append('item', item.id);
      fd.append('supplier', ofSupplier.trim());
      fd.append('contact', ofContact.trim());
      fd.append('unit_price', String(ofPrice ?? 0));
      fd.append('valid_until', ofValid);
      fd.append('notes', ofNotes.trim());
      fd.append('chosen', 'false');
      if (ofFile?.[0]) fd.append('file', ofFile[0]);
      await auth.pb.collection('cost_offers').create(fd);
      ofSupplier = ofContact = ofValid = ofNotes = '';
      ofPrice = null;
      ofFile = null;
      showOfferForm = false;
      if (item.status === 'offen' || item.status === 'angefragt') {
        const rec = (await auth.pb
          .collection('cost_items')
          .update(item.id, { status: 'angebot' })) as unknown as CostItem;
        setItem(rec);
      }
      await loadOffers();
    } catch (err) {
      errorMsg = errorMessage(
        err,
        'Angebot konnte nicht gespeichert werden (PDF/Bild, max. 20 MB).',
      );
    } finally {
      savingOffer = false;
    }
  }

  /** Angebot auswaehlen: Lieferant + Preis in die Position uebernehmen. */
  async function chooseOffer(o: CostOffer) {
    if (!auth.pb || !item || !canWrite) return;
    if (
      dirty &&
      !confirm('Ungespeicherte Aenderungen an der Position gehen dabei verloren. Weiter?')
    )
      return;
    errorMsg = null;
    try {
      for (const other of offers.filter((x) => x.chosen && x.id !== o.id)) {
        await auth.pb.collection('cost_offers').update(other.id, { chosen: false });
      }
      await auth.pb.collection('cost_offers').update(o.id, { chosen: true });
      const rec = (await auth.pb.collection('cost_items').update(item.id, {
        supplier: o.supplier,
        unit_price: o.unit_price,
        status: item.status === 'beauftragt' ? 'beauftragt' : 'angebot',
      })) as unknown as CostItem;
      setItem(rec);
      await loadOffers();
    } catch (err) {
      errorMsg = errorMessage(err, 'Angebot konnte nicht uebernommen werden.');
    }
  }

  async function removeOffer(o: CostOffer) {
    if (!auth.pb || !canDelete) return;
    if (!confirm(`Angebot von ${o.supplier} loeschen?`)) return;
    try {
      await auth.pb.collection('cost_offers').delete(o.id);
      await loadOffers();
    } catch (err) {
      errorMsg = errorMessage(err, 'Loeschen fehlgeschlagen.');
    }
  }

  async function openFile(o: CostOffer) {
    if (!auth.pb || !o.file) return;
    try {
      if (!fileToken) fileToken = await auth.pb.files.getToken();
      const url = auth.pb.files.getURL({ collectionName: 'cost_offers', id: o.id }, o.file, {
        token: fileToken,
      });
      window.open(url, '_blank', 'noopener');
      setTimeout(() => (fileToken = ''), 60_000);
    } catch (err) {
      errorMsg = errorMessage(err, 'Datei konnte nicht geoeffnet werden.');
    }
  }

  async function removeItem() {
    if (!auth.pb || !item || !canDelete) return;
    if (!confirm(`„${item.title}“ mit allen Angeboten loeschen?`)) return;
    try {
      await auth.pb.collection('cost_items').delete(item.id);
      await goto('/crew/kosten');
    } catch (err) {
      errorMsg = errorMessage(err, 'Loeschen fehlgeschlagen.');
    }
  }

  function phaseLabel(p: PlanDay['phase']): string {
    return PHASES.find((x) => x.key === p)?.label ?? p;
  }
</script>

<svelte:head>
  <title>{item?.title ?? 'Position'} · Kostenplanung</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <a href="/crew/kosten" class="text-sm text-fg-muted hover:text-fg">← Kostenplanung</a>

  {#if !auth.canRead(RES)}
    <div class="card mt-6 p-6">
      <p class="font-medium text-fg">Kein Zugriff</p>
      <p class="mt-2 text-sm text-fg-muted">Dafuer brauchst du das Recht „Kostenplanung“.</p>
    </div>
  {:else if loading}
    <div class="card mt-6 h-56 animate-pulse opacity-50"></div>
  {:else if notFound}
    <div class="card mt-6 p-6">
      <p class="font-medium text-fg">Position nicht gefunden</p>
      <div class="mt-4"><Button href="/crew/kosten" variant="ghost">Zur Uebersicht</Button></div>
    </div>
  {:else if item && form}
    <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wider text-accent">
          {categoryLabel(item.category)}
        </p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-fg md:text-4xl">{item.title}</h1>
        <p class="mt-2 text-sm text-fg-muted">
          {edition?.name ?? ''} · {STATUS_LABELS[item.status]}{item.paid ? ' · bezahlt' : ''}
        </p>
      </div>
      <div class="card p-4 text-right">
        <p class="text-xs font-medium text-fg-muted">Betrag</p>
        <p class="text-2xl font-semibold text-fg tabular-nums">{money(amount)}</p>
        <p class="text-xs text-fg-muted">{formula(form, money)}</p>
      </div>
    </div>

    {#if errorMsg}<p class="mt-4 text-sm text-danger" role="alert">{errorMsg}</p>{/if}

    <form onsubmit={save} class="mt-8 flex flex-col gap-5">
      <fieldset disabled={!canWrite} class="contents">
        <section class="card p-5 md:p-6">
          <h2 class="text-lg font-semibold text-fg">Position</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">Bezeichnung</span>
              <input class="field mt-1" bind:value={form.title} required maxlength="200" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">Kategorie</span>
              <select class="field mt-1" bind:value={form.category}>
                {#each CATEGORIES as c (c.key)}
                  <option value={c.key}>{c.label}</option>
                {/each}
                {#if !CATEGORIES.some((c) => c.key === form?.category)}
                  <option value={form.category}>{form.category}</option>
                {/if}
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">Status</span>
              <select class="field mt-1" bind:value={form.status}>
                {#each COST_STATUSES as s (s)}
                  <option value={s}>{STATUS_LABELS[s]}</option>
                {/each}
              </select>
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">Lieferant / Dienstleister</span>
              <input class="field mt-1" bind:value={form.supplier} maxlength="200" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">Abrechnung</span>
              <select class="field mt-1" bind:value={form.pricing}>
                {#each Object.entries(PRICING_LABELS) as [k, label] (k)}
                  <option value={k}>{label}</option>
                {/each}
              </select>
            </label>
            {#if form.pricing === 'stueck' || form.pricing === 'pro_tag'}
              <label class="block">
                <span class="text-xs font-medium text-fg-muted">Menge</span>
                <input
                  class="field mt-1"
                  type="number"
                  min="0"
                  step="1"
                  bind:value={form.quantity}
                />
              </label>
            {:else if form.pricing === 'stunden'}
              <label class="block">
                <span class="text-xs font-medium text-fg-muted">Personen</span>
                <input
                  class="field mt-1"
                  type="number"
                  min="0"
                  step="1"
                  bind:value={form.quantity}
                />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-fg-muted">Stunden pro Tag</span>
                <input
                  class="field mt-1"
                  type="number"
                  min="0"
                  step="0.5"
                  bind:value={form.hours}
                />
              </label>
            {/if}
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">
                {form.pricing === 'pauschal'
                  ? `Betrag (${currency})`
                  : form.pricing === 'stunden'
                    ? `Stundensatz (${currency})`
                    : `Preis je Einheit${form.pricing === 'pro_tag' ? ' und Tag' : ''} (${currency})`}
              </span>
              <input
                class="field mt-1"
                type="number"
                min="0"
                step="0.01"
                bind:value={form.unit_price}
              />
            </label>
            <label class="flex items-end gap-2 pb-3 text-sm text-fg">
              <input type="checkbox" bind:checked={form.paid} /> Bezahlt
            </label>
          </div>

          {#if needsDays}
            <div class="mt-5">
              <p class="text-xs font-medium text-fg-muted">
                Tage ({(form.days ?? []).length} ausgewaehlt)
              </p>
              {#if days.length === 0}
                <p class="mt-2 text-sm text-fg-muted">
                  Die Edition hat noch keine Festivaltage. Trag sie in der Kostenplanung unter
                  „Bearbeiten“ ein, dann kannst du hier Tage waehlen. Bis dahin zaehlt 1 Tag.
                </p>
              {:else}
                {#each PHASES as ph (ph.key)}
                  {@const list = days.filter((d) => d.phase === ph.key)}
                  {#if list.length > 0}
                    {@const allOn = list.every((d) => (form?.days ?? []).includes(d.iso))}
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        class="phase"
                        aria-pressed={allOn}
                        onclick={() => setPhase(ph.key, !allOn)}>{ph.label}</button
                      >
                      {#each list as d (d.iso)}
                        {@const on = (form.days ?? []).includes(d.iso)}
                        <button
                          type="button"
                          class="day day-{d.phase}"
                          class:on
                          aria-pressed={on}
                          title="{phaseLabel(d.phase)} {d.iso}"
                          onclick={() => toggleDay(d.iso)}>{formatDay(d.iso)}</button
                        >
                      {/each}
                    </div>
                  {/if}
                {/each}
              {/if}
            </div>
          {/if}

          <label class="mt-5 block">
            <span class="text-xs font-medium text-fg-muted">Notizen</span>
            <textarea class="field mt-1" rows="3" bind:value={form.notes} maxlength="4000"
            ></textarea>
          </label>
        </section>
      </fieldset>

      {#if canWrite && (dirty || saving || savedAt)}
        <div class="savebar glass-strong">
          <span class="text-sm text-fg-muted">
            {#if dirty}Ungespeicherte Aenderungen · {money(
                amount,
              )}{:else if savedAt}Gespeichert{/if}
          </span>
          <Button type="submit" disabled={saving || !dirty}
            >{saving ? 'Speichert …' : 'Speichern'}</Button
          >
        </div>
      {/if}
    </form>

    <!-- Angebote -->
    <section class="card mt-5 p-5 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-fg">Angebote</h2>
          <p class="mt-1 text-sm text-fg-muted">
            Mehrere Lieferanten vergleichen. Das ausgewaehlte Angebot setzt Lieferant und Preis der
            Position.
          </p>
        </div>
        {#if canWrite && !showOfferForm}
          <Button variant="ghost" onclick={() => (showOfferForm = true)}>+ Angebot</Button>
        {/if}
      </div>

      {#if offers.length > 0}
        <ul class="mt-4 flex flex-col gap-2">
          {#each offers as o (o.id)}
            {@const total = itemAmount(form, o.unit_price)}
            {@const cheapest = Math.min(...offers.map((x) => itemAmount(form!, x.unit_price)))}
            <li class="offer" class:chosen={o.chosen}>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-fg">
                  {o.supplier}
                  {#if o.chosen}<span class="tag tag-on">ausgewaehlt</span>{/if}
                  {#if offers.length > 1 && total === cheapest}<span class="tag">guenstigstes</span
                    >{/if}
                </p>
                <p class="mt-0.5 text-xs text-fg-muted">
                  {[
                    o.contact,
                    o.valid_until ? `gueltig bis ${formatDay(o.valid_until)}` : '',
                    `${money(o.unit_price)} je Einheit`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {#if o.notes}<p class="mt-1 whitespace-pre-wrap text-xs text-fg-muted">
                    {o.notes}
                  </p>{/if}
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-fg tabular-nums">{money(total)}</span>
                {#if o.file}
                  <button type="button" class="link" onclick={() => void openFile(o)}>PDF</button>
                {/if}
                {#if canWrite && !o.chosen}
                  <button type="button" class="link" onclick={() => void chooseOffer(o)}
                    >Auswaehlen</button
                  >
                {/if}
                {#if canDelete}
                  <button type="button" class="link link-danger" onclick={() => void removeOffer(o)}
                    >Loeschen</button
                  >
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else if !showOfferForm}
        <p class="mt-3 text-sm text-fg-muted">Noch keine Angebote.</p>
      {/if}

      {#if showOfferForm}
        <form onsubmit={addOffer} class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="block sm:col-span-2">
            <span class="text-xs font-medium text-fg-muted">Lieferant</span>
            <input class="field mt-1" bind:value={ofSupplier} required maxlength="200" />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-xs font-medium text-fg-muted">Kontakt (Name, Telefon, E-Mail)</span>
            <input class="field mt-1" bind:value={ofContact} maxlength="300" />
          </label>
          <label class="block">
            <span class="text-xs font-medium text-fg-muted">
              {form.pricing === 'pauschal'
                ? 'Angebotspreis'
                : form.pricing === 'stunden'
                  ? 'Stundensatz'
                  : 'Preis je Einheit'} ({currency})
            </span>
            <input
              class="field mt-1"
              type="number"
              min="0"
              step="0.01"
              bind:value={ofPrice}
              required
            />
          </label>
          <label class="block">
            <span class="text-xs font-medium text-fg-muted">Gueltig bis</span>
            <input class="field mt-1" type="date" bind:value={ofValid} />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-xs font-medium text-fg-muted">Angebot als PDF/Bild (optional)</span>
            <input
              class="field mt-1"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              bind:files={ofFile}
            />
          </label>
          <label class="block sm:col-span-2 lg:col-span-4">
            <span class="text-xs font-medium text-fg-muted">Notizen</span>
            <input class="field mt-1" bind:value={ofNotes} maxlength="2000" />
          </label>
          {#if ofPrice !== null}
            <p class="text-sm text-fg-muted sm:col-span-2 lg:col-span-4">
              Ergibt fuer diese Position: <strong class="text-fg"
                >{money(itemAmount(form, ofPrice))}</strong
              >
            </p>
          {/if}
          <div class="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={savingOffer}
              >{savingOffer ? 'Speichert …' : 'Angebot speichern'}</Button
            >
            <Button variant="ghost" onclick={() => (showOfferForm = false)}>Abbrechen</Button>
          </div>
        </form>
      {/if}
    </section>

    {#if canDelete}
      <div class="mt-10">
        <button type="button" class="link link-danger" onclick={() => void removeItem()}>
          Position loeschen
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .day,
  .phase {
    padding: 0.3rem 0.7rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg-muted);
    font-size: 0.8rem;
    cursor: pointer;
  }
  .phase {
    min-width: 5.5rem;
    font-weight: 600;
    color: var(--color-fg);
  }
  .phase[aria-pressed='true'] {
    border-color: var(--color-accent);
  }
  .day.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    border-color: transparent;
  }
  .day-aufbau:not(.on),
  .day-abbau:not(.on) {
    border-style: dashed;
  }
  .offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-md);
    background-color: rgba(0, 0, 0, 0.18);
    border: 1px solid var(--glass-border);
  }
  .offer.chosen {
    border-color: color-mix(in srgb, var(--color-success) 55%, transparent);
  }
  .tag {
    margin-left: 0.4rem;
    padding: 0.02rem 0.45rem;
    border-radius: var(--radius-pill);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--color-accent);
    border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
  }
  .tag-on {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  .link {
    font-size: 0.85rem;
    color: var(--color-accent);
    background: none;
    cursor: pointer;
  }
  .link-danger {
    color: var(--color-danger);
  }
  .savebar {
    position: sticky;
    bottom: 1rem;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-pill);
  }
</style>
