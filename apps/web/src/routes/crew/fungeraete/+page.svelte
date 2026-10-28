<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { listCrewMembers, memberName, errorMessage, type CrewMember } from '$lib/crew-api';
  import { CREW_WINDOW_START, CREW_WINDOW_END, FESTIVAL_DAY, isoDay } from '$lib/festival';
  import { fmtLongDay } from '$lib/crew/dates';
  import BackLink from '$lib/crew/BackLink.svelte';
  import NoAccess from '$lib/crew/NoAccess.svelte';
  import Sheet from '$lib/crew/Sheet.svelte';
  import Segmented from '$lib/crew/Segmented.svelte';
  import { t, locale } from '$lib/i18n';

  type Equipment = 'razor' | 'headphones' | 'inear';

  interface Request {
    id: string;
    user: string;
    event_day: string;
    equipment: Equipment;
    note: string;
  }

  const EQUIPMENT_LABEL: Record<Equipment, string> = {
    razor: t('Rasierer', 'Razor'),
    headphones: t('Kopfhoerer', 'Headphones'),
    inear: 'InEar',
  };
  const EQUIPMENT_VALUES: Equipment[] = ['razor', 'headphones', 'inear'];

  const RES = CREW_RESOURCES.fungeraete;
  const canRead = $derived(auth.canRead(RES));
  const canWrite = $derived(auth.canWrite(RES));
  const canDeleteAny = $derived(auth.canDelete(RES));

  let requests = $state<Request[]>([]);
  let members = $state<Map<string, CrewMember>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let formDay = $state('');
  let formEquipment = $state<Equipment>('headphones');
  let formNote = $state('');
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);

  const myId = $derived(auth.user?.id ?? '');

  // Alle Tage des Crew-Fensters.
  const days = (() => {
    const result: { iso: string; date: Date; isFestival: boolean }[] = [];
    const cursor = new Date(CREW_WINDOW_START);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= CREW_WINDOW_END) {
      const iso = isoDay(cursor);
      result.push({ iso, date: new Date(cursor), isFestival: iso === FESTIVAL_DAY });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  })();

  const requestsByDay = $derived.by(() => {
    const buckets = new Map<string, Request[]>();
    for (const r of requests) {
      const arr = buckets.get(r.event_day) ?? [];
      arr.push(r);
      buckets.set(r.event_day, arr);
    }
    return buckets;
  });

  const myByDay = $derived(
    new Map(requests.filter((r) => r.user === myId).map((r) => [r.event_day, r])),
  );

  function countByEquipment(list: Request[]): Record<Equipment, number> {
    const c: Record<Equipment, number> = { razor: 0, headphones: 0, inear: 0 };
    for (const r of list) c[r.equipment]++;
    return c;
  }

  // Bestellempfehlung: Peak-Bedarf pro Geraet ueber das gesamte Crew-Fenster.
  // Gemietet wird fuer die ganze Zeit auf einmal; die Stueckzahl richtet sich
  // nach dem Tag mit dem hoechsten Bedarf, weil Geraete parallel genutzt und
  // nicht von Tag zu Tag weitergereicht werden.
  let reserveBuffer = $state(20); // Prozent Reserve

  const peakDemand = $derived.by(() => {
    const peak: Record<Equipment, number> = { razor: 0, headphones: 0, inear: 0 };
    for (const list of requestsByDay.values()) {
      const c = countByEquipment(list);
      for (const eq of EQUIPMENT_VALUES) if (c[eq] > peak[eq]) peak[eq] = c[eq];
    }
    return peak;
  });

  const orderRecommendation = $derived.by(() => {
    const factor = 1 + reserveBuffer / 100;
    const rec = {} as Record<Equipment, number>;
    for (const eq of EQUIPMENT_VALUES) rec[eq] = Math.ceil(peakDemand[eq] * factor);
    return rec;
  });

  const totalOrder = $derived(
    EQUIPMENT_VALUES.reduce((sum, eq) => sum + orderRecommendation[eq], 0),
  );

  onMount(() => {
    if (canRead) void load();
    else loading = false;
  });

  async function load() {
    const pb = auth.pb;
    if (!pb) return;
    loading = true;
    errorMsg = null;
    try {
      const [rows, people] = await Promise.all([
        pb.collection('crew_equipment_requests').getFullList({
          filter: pb.filter('event_day >= {:from} && event_day <= {:to}', {
            from: isoDay(CREW_WINDOW_START),
            to: isoDay(CREW_WINDOW_END),
          }),
          sort: 'event_day,created',
        }),
        listCrewMembers().catch(() => [] as CrewMember[]),
      ]);
      requests = rows.map((r) => ({
        id: r.id,
        user: r.user,
        event_day: r.event_day,
        equipment: r.equipment as Equipment,
        note: r.note ?? '',
      }));
      members = new Map(people.map((m) => [m.id, m]));
    } catch (err) {
      console.error('[crew/fungeraete] load failed', err);
      errorMsg = errorMessage(err, t('Konnte die Liste nicht laden.', 'Could not load the list.'));
    } finally {
      loading = false;
    }
  }

  function fmtDay(d: Date): string {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  }
  function fmtWeekday(d: Date): string {
    return d.toLocaleDateString(locale, { weekday: 'short' });
  }

  function openForm(iso: string) {
    const existing = myByDay.get(iso);
    formDay = iso;
    formEquipment = existing?.equipment ?? 'headphones';
    formNote = existing?.note ?? '';
    formError = null;
  }

  function closeForm() {
    if (!saving) formDay = '';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const pb = auth.pb;
    if (!pb || !myId || !formDay) return;
    saving = true;
    formError = null;
    try {
      // Upsert: ein Eintrag pro (user, event_day).
      const existing = myByDay.get(formDay);
      const data = { equipment: formEquipment, note: formNote.trim() };
      if (existing) {
        await pb.collection('crew_equipment_requests').update(existing.id, data);
      } else {
        await pb
          .collection('crew_equipment_requests')
          .create({ ...data, user: myId, event_day: formDay });
      }
      formDay = '';
      await load();
    } catch (err) {
      console.error('[crew/fungeraete] save failed', err);
      formError = errorMessage(
        err,
        t('Konnte den Eintrag nicht speichern.', 'Could not save the entry.'),
      );
    } finally {
      saving = false;
    }
  }

  async function deleteRequest(r: Request) {
    const pb = auth.pb;
    if (!pb) return;
    const question =
      r.user === myId
        ? t('Anforderung wirklich loeschen?', 'Really delete this request?')
        : t(
            `Anforderung von ${memberName(members.get(r.user))} wirklich loeschen?`,
            `Really delete the request by ${memberName(members.get(r.user))}?`,
          );
    if (!confirm(question)) return;
    deleting = r.id;
    errorMsg = null;
    try {
      await pb.collection('crew_equipment_requests').delete(r.id);
      requests = requests.filter((x) => x.id !== r.id);
      if (formDay === r.event_day && r.user === myId) formDay = '';
    } catch (err) {
      console.error('[crew/fungeraete] delete failed', err);
      errorMsg = errorMessage(
        err,
        t('Konnte die Anforderung nicht loeschen.', 'Could not delete the request.'),
      );
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>{t('Funkgeraete · Crew', 'Radios · Crew')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <BackLink />
  <h1 class="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
    {t('Funkgeraete', 'Radios')}
  </h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    {t(
      'Welches Headset brauchst du an welchem Tag? Pro Tag eine Wahl: Rasierer, Kopfhoerer oder InEar.',
      'Which headset do you need on which day? One choice per day: razor, headphones or in-ear.',
    )}
  </p>

  {#if !canRead}
    <NoAccess area={t('die Funkgeraete-Planung', 'radio planning')} />
  {:else}
    {#if errorMsg}
      <p class="card mt-6 p-4 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    {#if loading}
      <div class="card mt-8 h-40 animate-pulse opacity-50"></div>
      <div class="card mt-4 h-96 animate-pulse opacity-50"></div>
    {:else}
      <!-- Bestellempfehlung -->
      <section class="card mt-8 p-6">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-xs font-medium uppercase tracking-wider text-accent">
            {t('Bestellempfehlung', 'Order recommendation')}
          </p>
          <p class="text-xs text-fg-muted">
            {t('Peak-Tag', 'Peak day')} × {(1 + reserveBuffer / 100).toFixed(2)}
          </p>
        </div>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
          {t(`${totalOrder} Geraete insgesamt bestellen`, `Order ${totalOrder} devices in total`)}
        </h2>
        <p class="mt-2 max-w-2xl text-sm text-fg-muted">
          {t(
            'Wir mieten die Geraete fuer das ganze Crew-Fenster auf einmal. Die Menge richtet sich nach dem Tag mit dem hoechsten Bedarf, weil die Geraete nicht von Tag zu Tag weitergegeben werden koennen.',
            "We rent the devices for the whole crew window at once. The quantity is based on the day with the highest demand, because devices can't be passed on from day to day.",
          )}
        </p>

        <div class="mt-5 grid grid-cols-3 gap-3">
          {#each EQUIPMENT_VALUES as eq (eq)}
            <div class="stat">
              <p class="text-xs text-fg-muted">{EQUIPMENT_LABEL[eq]}</p>
              <p class="mt-1 text-3xl font-semibold tabular-nums leading-none text-fg">
                {orderRecommendation[eq]}
              </p>
              <p class="mt-2 text-[11px] text-fg-muted">Peak {peakDemand[eq]}</p>
            </div>
          {/each}
        </div>

        <div class="mt-5 flex items-center gap-3">
          <label for="reserve" class="shrink-0 text-xs font-medium text-fg-muted">
            {t('Reserve', 'Buffer')}
          </label>
          <input
            id="reserve"
            type="range"
            min="0"
            max="50"
            step="5"
            bind:value={reserveBuffer}
            class="range flex-1"
          />
          <span class="w-12 text-right text-sm font-medium tabular-nums text-accent"
            >+{reserveBuffer}%</span
          >
        </div>

        {#if totalOrder === 0}
          <p class="mt-4 text-sm text-fg-muted">
            {t(
              'Noch keine Anforderungen. Sobald die Crew sich eintraegt, fuellt sich der Bedarf hier.',
              'No requests yet. Demand will show up here as soon as the crew signs up.',
            )}
          </p>
        {/if}
      </section>

      <!-- Tagesliste -->
      <ul class="card mt-6 divide-y divide-[var(--glass-border)] overflow-hidden">
        {#each days as day (day.iso)}
          {@const dayReqs = requestsByDay.get(day.iso) ?? []}
          {@const counts = countByEquipment(dayReqs)}
          {@const mineReq = myByDay.get(day.iso)}
          <li class="day" class:festival={day.isFestival}>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium {day.isFestival ? 'text-accent' : 'text-fg-muted'}">
                  {day.isFestival ? `Festival · ${fmtWeekday(day.date)}` : fmtWeekday(day.date)}
                </p>
                <p class="text-lg font-semibold tabular-nums text-fg">{fmtDay(day.date)}</p>
              </div>
              {#if canWrite}
                <Button
                  variant={mineReq ? 'ghost' : 'yellow'}
                  class="shrink-0 !px-4 !py-2 !text-sm"
                  onclick={() => openForm(day.iso)}
                >
                  {mineReq ? t('Aendern', 'Change') : t('Anfordern', 'Request')}
                </Button>
              {/if}
            </div>

            {#if dayReqs.length === 0}
              <p class="mt-2 text-sm text-fg-muted">
                {t('Niemand braucht hier was.', 'Nobody needs anything here.')}
              </p>
            {:else}
              <div class="mt-2 flex flex-wrap gap-2">
                {#each EQUIPMENT_VALUES as eq (eq)}
                  {#if counts[eq] > 0}
                    <span class="chip">
                      <span class="font-semibold tabular-nums text-fg">{counts[eq]}</span>
                      {EQUIPMENT_LABEL[eq]}
                    </span>
                  {/if}
                {/each}
              </div>
              <ul class="mt-3 flex flex-col gap-1.5">
                {#each dayReqs as r (r.id)}
                  {@const mine = r.user === myId}
                  <li class="flex items-start justify-between gap-3 text-sm">
                    <div class="min-w-0">
                      <span class="font-medium" class:text-accent={mine} class:text-fg={!mine}>
                        {memberName(members.get(r.user))}{mine ? t(' (du)', ' (you)') : ''}
                      </span>
                      <span class="text-fg-muted"> · {EQUIPMENT_LABEL[r.equipment]}</span>
                      {#if r.note}
                        <p class="break-words text-xs text-fg-muted">{r.note}</p>
                      {/if}
                    </div>
                    {#if (mine && canWrite) || canDeleteAny}
                      <button
                        type="button"
                        class="link"
                        disabled={deleting === r.id}
                        onclick={() => deleteRequest(r)}
                      >
                        {deleting === r.id ? '…' : t('Loeschen', 'Delete')}
                      </button>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

{#if formDay}
  <Sheet
    eyebrow={myByDay.has(formDay)
      ? t('Anforderung aendern', 'Change request')
      : t('Funkgeraet anfordern', 'Request a radio')}
    title={fmtLongDay(formDay)}
    onclose={closeForm}
  >
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <Segmented
        label={t('Geraet', 'Device')}
        full
        options={EQUIPMENT_VALUES.map((eq) => ({ value: eq, label: EQUIPMENT_LABEL[eq] }))}
        bind:value={formEquipment}
      />

      <label class="block">
        <span class="text-xs font-medium text-fg-muted"
          >{t('Notiz (optional)', 'Note (optional)')}</span
        >
        <input
          type="text"
          bind:value={formNote}
          maxlength="200"
          placeholder={t('z.B. Allergie, Wunschmarke', 'e.g. allergy, preferred brand')}
          class="field mt-2"
        />
      </label>

      {#if formError}
        <p class="text-sm text-danger" role="alert">{formError}</p>
      {/if}

      <div class="flex flex-wrap gap-3 pt-1">
        <Button type="submit" disabled={saving}
          >{saving ? t('Speichere …', 'Saving …') : t('Speichern', 'Save')}</Button
        >
        <Button variant="ghost" onclick={closeForm} disabled={saving}
          >{t('Abbrechen', 'Cancel')}</Button
        >
      </div>
    </form>
  </Sheet>
{/if}

<style>
  .stat {
    padding: 0.9rem 1rem;
    border-radius: var(--radius-lg);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .range {
    accent-color: var(--color-accent);
  }
  .day {
    padding: 1rem 1.25rem;
  }
  .day.festival {
    background-color: var(--glass-bg-strong);
    box-shadow: inset 3px 0 0 var(--color-accent);
  }
  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }
  .link {
    flex-shrink: 0;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    transition: color var(--dur-hover) var(--ease-out);
  }
  .link:hover {
    color: var(--color-danger);
  }
  .link:disabled {
    opacity: 0.5;
  }
</style>
