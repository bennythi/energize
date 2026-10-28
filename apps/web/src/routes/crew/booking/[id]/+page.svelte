<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { errorMessage } from '$lib/crew-api';
  import {
    ITEM_KINDS,
    KIND_LABELS,
    STATUS_LABELS,
    artistCosts,
    checkState,
    editionDays,
    formatDay,
    formatMoney,
    type Artist,
    type BookingItem,
    type CheckKey,
    type Edition,
  } from '$lib/booking';
  import CheckChips from '$lib/booking/CheckChips.svelte';
  import ItemSection from '$lib/booking/ItemSection.svelte';
  import { t } from '$lib/i18n';

  let { data }: { data: { id: string } } = $props();

  const RES = CREW_RESOURCES.booking;
  const canWrite = $derived(auth.canWrite(RES));
  const canDelete = $derived(auth.canDelete(RES));

  let artist = $state<Artist | null>(null);
  let edition = $state<Edition | null>(null);
  let items = $state<BookingItem[]>([]);
  let loading = $state(true);
  let notFound = $state(false);
  let errorMsg = $state<string | null>(null);

  // Formularzustand (Kopie des Artists, damit "Speichern" bewusst passiert).
  type Form = Omit<Artist, 'id' | 'edition' | 'rider_files' | 'not_needed' | 'updated'>;
  let form = $state<Form | null>(null);
  let saving = $state(false);
  let savedAt = $state<number | null>(null);

  let uploading = $state(false);
  let fileToken = $state('');

  const currency = $derived(edition?.currency || 'EUR');
  // Tage der Edition: 1 Tag = automatisch, mehrere = Auswahl, keiner = Datumsfeld.
  const days = $derived(editionDays(edition));
  const dayOptions = $derived(
    form?.day && !days.includes(form.day) ? [...days, form.day].sort() : days,
  );
  const costs = $derived(artist ? artistCosts(artist, items) : null);
  const dirty = $derived(
    !!artist &&
      !!form &&
      (Object.keys(form) as (keyof Form)[]).some((k) => form![k] !== artist![k]),
  );

  $effect(() => {
    void load(data.id);
  });

  async function load(id: string) {
    if (!auth.pb || !auth.canRead(RES)) {
      loading = false;
      return;
    }
    loading = true;
    errorMsg = null;
    try {
      const rec = (await auth.pb
        .collection('booking_artists')
        .getOne(id, { expand: 'edition' })) as unknown as Artist & {
        expand?: { edition?: Edition };
      };
      edition = rec.expand?.edition ?? null;
      setArtist(rec);
      await autoSetSingleDay();
      await loadItems();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) notFound = true;
      else
        errorMsg = errorMessage(
          err,
          t('Artist konnte nicht geladen werden.', 'Could not load artist.'),
        );
    } finally {
      loading = false;
    }
  }

  function setArtist(rec: Artist) {
    const { expand: _expand, ...plain } = rec as Artist & { expand?: unknown };
    void _expand;
    artist = { ...plain, not_needed: Array.isArray(plain.not_needed) ? plain.not_needed : [] };
    form = {
      name: plain.name,
      sanity_slug: plain.sanity_slug,
      status: plain.status,
      day: plain.day,
      slot_start: plain.slot_start,
      slot_end: plain.slot_end,
      stage: plain.stage,
      agency: plain.agency,
      contact_name: plain.contact_name,
      contact_email: plain.contact_email,
      contact_phone: plain.contact_phone,
      fee: plain.fee,
      fee_note: plain.fee_note,
      contract_signed: plain.contract_signed,
      invoice_received: plain.invoice_received,
      fee_paid: plain.fee_paid,
      rider_tech: plain.rider_tech,
      rider_hospitality: plain.rider_hospitality,
      notes: plain.notes,
    };
  }

  /** Eintaegiges Event: Tag automatisch setzen und gleich speichern. */
  async function autoSetSingleDay() {
    const only = editionDays(edition);
    if (!auth.pb || !artist || only.length !== 1 || artist.day === only[0]) return;
    if (!auth.canWrite(RES)) return;
    try {
      const rec = (await auth.pb
        .collection('booking_artists')
        .update(artist.id, { day: only[0] })) as unknown as Artist;
      setArtist(rec);
    } catch (err) {
      console.warn('[booking] auto day failed', err);
    }
  }

  async function loadItems() {
    if (!auth.pb) return;
    items = (await auth.pb.collection('booking_items').getFullList({
      filter: auth.pb.filter('artist = {:a}', { a: data.id }),
      sort: 'start_at,created',
    })) as unknown as BookingItem[];
  }

  async function save(event?: SubmitEvent) {
    event?.preventDefault();
    if (!auth.pb || !artist || !form || !canWrite) return;
    saving = true;
    errorMsg = null;
    try {
      const rec = (await auth.pb
        .collection('booking_artists')
        .update(artist.id, { ...form, fee: Number(form.fee) || 0 })) as unknown as Artist;
      setArtist(rec);
      savedAt = Date.now();
    } catch (err) {
      errorMsg = errorMessage(err, t('Speichern fehlgeschlagen.', 'Saving failed.'));
    } finally {
      saving = false;
    }
  }

  /** Aenderungen verwerfen und zurueck zur Uebersicht. */
  async function cancel() {
    if (dirty && !confirm(t('Ungespeicherte Aenderungen verwerfen?', 'Discard unsaved changes?')))
      return;
    if (artist) setArtist(artist);
    await goto('/crew/booking');
  }

  // Nicht aus Versehen mit ungespeicherten Aenderungen wegnavigieren.
  beforeNavigate((nav) => {
    if (!dirty || saving) return;
    if (nav.type === 'leave') {
      nav.cancel();
      return;
    }
    if (
      !confirm(
        t(
          'Du hast ungespeicherte Aenderungen. Seite trotzdem verlassen?',
          'You have unsaved changes. Leave the page anyway?',
        ),
      )
    )
      nav.cancel();
    else if (artist) setArtist(artist);
  });

  async function toggleNotNeeded(key: CheckKey) {
    if (!auth.pb || !artist || !canWrite) return;
    const cur = artist.not_needed ?? [];
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    try {
      await auth.pb.collection('booking_artists').update(artist.id, { not_needed: next });
      artist = { ...artist, not_needed: next };
    } catch (err) {
      errorMsg = errorMessage(err, t('Aendern fehlgeschlagen.', 'Update failed.'));
    }
  }

  async function removeArtist() {
    if (!auth.pb || !artist || !canDelete) return;
    if (
      !confirm(
        t(
          `${artist.name} mit allen Buchungen wirklich loeschen?`,
          `Really delete ${artist.name} including all bookings?`,
        ),
      )
    )
      return;
    try {
      await auth.pb.collection('booking_artists').delete(artist.id);
      await goto('/crew/booking');
    } catch (err) {
      errorMsg = errorMessage(err, t('Loeschen fehlgeschlagen.', 'Deleting failed.'));
    }
  }

  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!auth.pb || !artist || !canWrite || files.length === 0) return;
    uploading = true;
    errorMsg = null;
    try {
      const fd = new FormData();
      for (const f of files) fd.append('rider_files+', f);
      const rec = (await auth.pb
        .collection('booking_artists')
        .update(artist.id, fd)) as unknown as Artist;
      artist = { ...artist, rider_files: rec.rider_files };
    } catch (err) {
      errorMsg = errorMessage(
        err,
        t(
          'Upload fehlgeschlagen (max. 20 MB, PDF/Bild/Word).',
          'Upload failed (max. 20 MB, PDF/image/Word).',
        ),
      );
    } finally {
      uploading = false;
      input.value = '';
    }
  }

  async function removeFile(name: string) {
    if (!auth.pb || !artist || !canWrite) return;
    if (!confirm(t('Datei wirklich entfernen?', 'Really remove file?'))) return;
    try {
      const rec = (await auth.pb
        .collection('booking_artists')
        .update(artist.id, { 'rider_files-': [name] })) as unknown as Artist;
      artist = { ...artist, rider_files: rec.rider_files };
    } catch (err) {
      errorMsg = errorMessage(err, t('Entfernen fehlgeschlagen.', 'Removing failed.'));
    }
  }

  async function openFile(name: string) {
    if (!auth.pb || !artist) return;
    try {
      if (!fileToken) fileToken = await auth.pb.files.getToken();
      const url = auth.pb.files.getURL({ collectionName: 'booking_artists', id: artist.id }, name, {
        token: fileToken,
      });
      window.open(url, '_blank', 'noopener');
      // Datei-Tokens sind kurzlebig, beim naechsten Klick neu holen.
      setTimeout(() => (fileToken = ''), 60_000);
    } catch (err) {
      errorMsg = errorMessage(
        err,
        t('Datei konnte nicht geoeffnet werden.', 'Could not open file.'),
      );
    }
  }

  function displayFileName(name: string): string {
    // PB haengt einen Zufalls-Suffix an: name_abc123XYZ.pdf
    return name.replace(/_[a-zA-Z0-9]{10}(\.[^.]+)$/, '$1');
  }

  const itemsByKind = $derived(
    Object.fromEntries(ITEM_KINDS.map((k) => [k, items.filter((i) => i.kind === k)])),
  );
</script>

<svelte:head>
  <title>{artist?.name ?? t('Artist', 'Artist')} · {t('DJ-Planung', 'DJ planning')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <a href="/crew/booking" class="text-sm text-fg-muted hover:text-fg"
    >← {t('DJ-Planung', 'DJ planning')}</a
  >

  {#if !auth.canRead(RES)}
    <div class="card mt-6 p-6">
      <p class="font-medium text-fg">{t('Kein Zugriff', 'No access')}</p>
      <p class="mt-2 text-sm text-fg-muted">
        {t(
          'Dafuer brauchst du das Recht „DJ-Planung“.',
          'You need the “DJ planning” permission for this.',
        )}
      </p>
    </div>
  {:else if loading}
    <div class="card mt-6 h-56 animate-pulse opacity-50"></div>
  {:else if notFound}
    <div class="card mt-6 p-6">
      <p class="font-medium text-fg">{t('Artist nicht gefunden', 'Artist not found')}</p>
      <div class="mt-4">
        <Button href="/crew/booking" variant="ghost"
          >{t('Zur Uebersicht', 'Back to overview')}</Button
        >
      </div>
    </div>
  {:else if artist && form}
    <!-- Kopf -->
    <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">{artist.name}</h1>
        <p class="mt-2 text-sm text-fg-muted">
          {edition?.name ?? ''} · {STATUS_LABELS[artist.status]}
        </p>
        <div class="mt-3"><CheckChips {artist} {items} /></div>
      </div>
      {#if costs}
        <div class="card p-4 text-right">
          <p class="text-xs font-medium text-fg-muted">{t('Gesamtkosten', 'Total costs')}</p>
          <p class="text-2xl font-semibold text-fg tabular-nums">
            {formatMoney(costs.total, currency)}
          </p>
          <p class="text-xs text-fg-muted tabular-nums">
            {t('bezahlt', 'paid')}
            {formatMoney(costs.paid, currency)}
          </p>
        </div>
      {/if}
    </div>

    {#if errorMsg}
      <p class="mt-4 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    <form onsubmit={save} class="mt-8 flex flex-col gap-5">
      <fieldset disabled={!canWrite} class="contents">
        <!-- Basis & Kontakt -->
        <section class="card p-5 md:p-6">
          <h2 class="text-lg font-semibold text-fg">{t('Basis & Kontakt', 'Basics & contact')}</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">Name</span>
              <input class="field mt-1" bind:value={form.name} required maxlength="160" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">{t('Status', 'Status')}</span>
              <select class="field mt-1" bind:value={form.status}>
                {#each Object.entries(STATUS_LABELS) as [key, label] (key)}
                  <option value={key}>{label}</option>
                {/each}
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Stage / Floor', 'Stage / floor')}</span
              >
              <input class="field mt-1" bind:value={form.stage} maxlength="80" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">{t('Tag', 'Day')}</span>
              {#if days.length === 1}
                <p
                  class="field mt-1 cursor-default opacity-80"
                  title={t('Eintaegiges Event', 'Single-day event')}
                >
                  {formatDay(days[0])}
                </p>
              {:else if days.length > 1}
                <select class="field mt-1" bind:value={form.day}>
                  <option value="">{t('– noch offen –', '– not set yet –')}</option>
                  {#each dayOptions as d (d)}
                    <option value={d}
                      >{formatDay(d)}{days.includes(d)
                        ? ''
                        : t(' (ausserhalb)', ' (outside)')}</option
                    >
                  {/each}
                </select>
              {:else}
                <input class="field mt-1" type="date" bind:value={form.day} />
              {/if}
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">{t('Slot von', 'Slot from')}</span>
              <input class="field mt-1" type="time" bind:value={form.slot_start} />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">{t('Slot bis', 'Slot to')}</span>
              <input class="field mt-1" type="time" bind:value={form.slot_end} />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Lineup-Slug (optional)', 'Lineup slug (optional)')}</span
              >
              <input
                class="field mt-1"
                bind:value={form.sanity_slug}
                maxlength="160"
                placeholder={t('z. B. brennan-heart', 'e.g. brennan-heart')}
              />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Agentur / Management', 'Agency / management')}</span
              >
              <input class="field mt-1" bind:value={form.agency} maxlength="160" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Ansprechpartner', 'Contact person')}</span
              >
              <input class="field mt-1" bind:value={form.contact_name} maxlength="160" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">{t('E-Mail', 'Email')}</span>
              <input
                class="field mt-1"
                type="email"
                bind:value={form.contact_email}
                maxlength="200"
              />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-fg-muted">{t('Telefon', 'Phone')}</span>
              <input class="field mt-1" type="tel" bind:value={form.contact_phone} maxlength="60" />
            </label>
          </div>
        </section>

        <!-- Gage & Vertrag -->
        <section class="card p-5 md:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-fg">{t('Gage & Vertrag', 'Fee & contract')}</h2>
              {#if checkState(artist, items, 'vertrag') === 'done'}
                <span class="pill pill-done">{t('unterschrieben', 'signed')}</span>
              {:else if checkState(artist, items, 'vertrag') === 'na'}
                <span class="pill">{t('nicht noetig', 'not needed')}</span>
              {:else}
                <span class="pill">{t('offen', 'open')}</span>
              {/if}
            </div>
            {#if canWrite}
              <button type="button" class="link" onclick={() => void toggleNotNeeded('vertrag')}>
                {artist.not_needed?.includes('vertrag')
                  ? t('Vertrag doch noetig', 'Contract needed after all')
                  : t('Kein Vertrag noetig', 'No contract needed')}
              </button>
            {/if}
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label class="block">
              <span class="text-xs font-medium text-fg-muted">{t('Gage', 'Fee')} ({currency})</span>
              <input class="field mt-1" type="number" min="0" step="0.01" bind:value={form.fee} />
            </label>
            <label class="block sm:col-span-1 lg:col-span-3">
              <span class="text-xs font-medium text-fg-muted"
                >{t(
                  'Hinweis zur Gage (netto/brutto, Steuer, Auslaendersteuer …)',
                  'Fee note (net/gross, tax, foreign artist tax …)',
                )}</span
              >
              <input class="field mt-1" bind:value={form.fee_note} maxlength="500" />
            </label>
          </div>
          <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <label class="flex items-center gap-2 text-sm text-fg">
              <input type="checkbox" bind:checked={form.contract_signed} />
              {t('Vertrag unterschrieben', 'Contract signed')}
            </label>
            <label class="flex items-center gap-2 text-sm text-fg">
              <input type="checkbox" bind:checked={form.invoice_received} />
              {t('Rechnung erhalten', 'Invoice received')}
            </label>
            <label class="flex items-center gap-2 text-sm text-fg">
              <input type="checkbox" bind:checked={form.fee_paid} />
              {t('Gage bezahlt', 'Fee paid')}
            </label>
          </div>
        </section>

        <!-- Rider -->
        <section class="card p-5 md:p-6">
          <h2 class="text-lg font-semibold text-fg">{t('Rider', 'Rider')}</h2>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label class="block">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Technik-Rider', 'Technical rider')}</span
              >
              <textarea
                class="field mt-1"
                rows="6"
                bind:value={form.rider_tech}
                maxlength="20000"
                placeholder={t(
                  'z. B. 3x CDJ-3000, DJM-V10, 2 Monitore',
                  'e.g. 3x CDJ-3000, DJM-V10, 2 monitors',
                )}
              ></textarea>
            </label>
            <label class="block">
              <span class="text-xs font-medium text-fg-muted"
                >{t('Hospitality-Rider', 'Hospitality rider')}</span
              >
              <textarea
                class="field mt-1"
                rows="6"
                bind:value={form.rider_hospitality}
                maxlength="20000"
                placeholder={t(
                  'z. B. Getraenke, Essen, Gaesteliste',
                  'e.g. drinks, food, guest list',
                )}
              ></textarea>
            </label>
          </div>
          <div class="mt-4">
            <p class="text-xs font-medium text-fg-muted">{t('Dateien', 'Files')}</p>
            {#if artist.rider_files?.length}
              <ul class="mt-2 flex flex-col gap-1.5">
                {#each artist.rider_files as name (name)}
                  <li class="flex flex-wrap items-center gap-3 text-sm">
                    <button type="button" class="link" onclick={() => void openFile(name)}>
                      {displayFileName(name)}
                    </button>
                    {#if canWrite}
                      <button
                        type="button"
                        class="link link-danger"
                        onclick={() => void removeFile(name)}>{t('Entfernen', 'Remove')}</button
                      >
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="mt-1 text-sm text-fg-muted">{t('Noch keine Dateien.', 'No files yet.')}</p>
            {/if}
            {#if canWrite}
              <label class="upload mt-3">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onchange={upload}
                  disabled={uploading}
                />
                <span
                  >{uploading
                    ? t('Laedt hoch …', 'Uploading …')
                    : t(
                        'Rider hochladen (PDF, Bild, Word)',
                        'Upload rider (PDF, image, Word)',
                      )}</span
                >
              </label>
            {/if}
          </div>
        </section>
      </fieldset>
    </form>

    <!-- Reise, Hotel, Transfer, Extras -->
    <div class="mt-5 flex flex-col gap-5">
      {#each ITEM_KINDS as kind (kind)}
        <ItemSection
          artistId={artist.id}
          {kind}
          items={itemsByKind[kind] ?? []}
          {currency}
          {canWrite}
          {canDelete}
          check={kind === 'zusatzkosten' ? undefined : checkState(artist, items, kind)}
          onToggleNotNeeded={kind === 'zusatzkosten'
            ? undefined
            : () => void toggleNotNeeded(kind as CheckKey)}
          onChange={() => void loadItems()}
        />
      {/each}
    </div>

    <!-- Notizen + Kosten -->
    <div class="mt-5 grid gap-5 md:grid-cols-[1fr_18rem]">
      <section class="card p-5 md:p-6">
        <h2 class="text-lg font-semibold text-fg">{t('Notizen', 'Notes')}</h2>
        <textarea
          class="field mt-3"
          rows="5"
          bind:value={form.notes}
          maxlength="20000"
          disabled={!canWrite}
          placeholder={t(
            'Absprachen, Gaesteliste, Besonderheiten …',
            'Agreements, guest list, special notes …',
          )}
        ></textarea>
      </section>
      {#if costs}
        <section class="card p-5 md:p-6" aria-label={t('Kosten', 'Costs')}>
          <h2 class="text-lg font-semibold text-fg">{t('Kosten', 'Costs')}</h2>
          <dl class="mt-3 flex flex-col gap-1.5 text-sm">
            <div class="flex justify-between">
              <dt class="text-fg-muted">{t('Gage', 'Fee')}</dt>
              <dd class="tabular-nums text-fg">{formatMoney(costs.fee, currency)}</dd>
            </div>
            {#each ITEM_KINDS as kind (kind)}
              <div class="flex justify-between">
                <dt class="text-fg-muted">{KIND_LABELS[kind]}</dt>
                <dd class="tabular-nums text-fg">{formatMoney(costs[kind], currency)}</dd>
              </div>
            {/each}
            <div class="mt-2 flex justify-between border-t border-[color:var(--glass-border)] pt-2">
              <dt class="font-semibold text-fg">{t('Gesamt', 'Total')}</dt>
              <dd class="font-semibold tabular-nums text-fg">
                {formatMoney(costs.total, currency)}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-fg-muted">{t('davon bezahlt', 'of which paid')}</dt>
              <dd class="tabular-nums text-success">{formatMoney(costs.paid, currency)}</dd>
            </div>
          </dl>
        </section>
      {/if}
    </div>

    {#if canWrite}
      <div class="savebar glass-strong" class:savebar-dirty={dirty}>
        <span class="text-sm" class:text-fg-muted={!dirty} class:text-fg={dirty}>
          {#if saving}{t('Speichert …', 'Saving …')}{:else if dirty}{t(
              'Ungespeicherte Aenderungen',
              'Unsaved changes',
            )}{:else if savedAt}✓ {t('Gespeichert', 'Saved')}{:else}{t(
              'Alles gespeichert',
              'All saved',
            )}{/if}
        </span>
        <div class="flex gap-2">
          <Button variant="ghost" onclick={() => void cancel()} disabled={saving}
            >{t('Abbrechen', 'Cancel')}</Button
          >
          <Button onclick={() => void save()} disabled={saving || !dirty}
            >{t('Speichern', 'Save')}</Button
          >
        </div>
      </div>
    {/if}

    {#if canDelete}
      <div class="mt-10">
        <button type="button" class="link link-danger" onclick={() => void removeArtist()}>
          {t('Artist loeschen', 'Delete artist')}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
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
  .link {
    font-size: 0.85rem;
    color: var(--color-accent);
    background: none;
    cursor: pointer;
    text-align: left;
  }
  .link-danger {
    color: var(--color-danger);
  }
  .upload {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border-radius: var(--radius-pill);
    border: 1px dashed var(--glass-border);
    color: var(--color-fg-muted);
    font-size: 0.85rem;
    cursor: pointer;
  }
  .upload input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .upload:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .savebar {
    position: sticky;
    bottom: 1rem;
    margin-top: 1.25rem;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-pill);
  }
  .savebar-dirty {
    border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
  }
</style>
