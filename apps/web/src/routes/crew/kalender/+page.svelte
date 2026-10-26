<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import { listCrewMembers, memberName, errorMessage, type CrewMember } from '$lib/crew-api';
  import { CREW_WINDOW_START, CREW_WINDOW_END, CREW_CALENDAR_MONTHS, isoDay } from '$lib/festival';
  import { parsePbDate, localDateTimeIso, fmtTime, fmtLongDay } from '$lib/crew/dates';
  import CalendarMonth from '$lib/crew/CalendarMonth.svelte';
  import BackLink from '$lib/crew/BackLink.svelte';
  import NoAccess from '$lib/crew/NoAccess.svelte';
  import Sheet from '$lib/crew/Sheet.svelte';
  import Segmented from '$lib/crew/Segmented.svelte';

  type Kind = 'all_day' | 'window';

  interface Entry {
    id: string;
    user: string;
    start: Date;
    end: Date;
    day: string;
    kind: Kind;
    note: string;
  }

  const RES = CREW_RESOURCES.kalender;
  const canRead = $derived(auth.canRead(RES));
  const canWrite = $derived(auth.canWrite(RES));
  const canDeleteAny = $derived(auth.canDelete(RES));

  let entries = $state<Entry[]>([]);
  let members = $state<Map<string, CrewMember>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let selectedDay = $state('');

  // Formular (neu oder bearbeiten)
  let formOpen = $state(false);
  let editId = $state<string | null>(null);
  let formDay = $state('');
  let formKind = $state<Kind>('all_day');
  let formStart = $state('09:00');
  let formEnd = $state('17:00');
  let formNote = $state('');
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let deleting = $state<string | null>(null);

  const myId = $derived(auth.user?.id ?? '');

  const entriesByDay = $derived.by(() => {
    const buckets = new Map<string, Entry[]>();
    for (const e of entries) {
      const arr = buckets.get(e.day) ?? [];
      arr.push(e);
      buckets.set(e.day, arr);
    }
    return buckets;
  });

  const countsByDay = $derived(
    new Map([...entriesByDay.entries()].map(([iso, list]) => [iso, list.length])),
  );

  const myDays = $derived(new Set(entries.filter((e) => e.user === myId).map((e) => e.day)));

  const selectedEntries = $derived(
    selectedDay
      ? [...(entriesByDay.get(selectedDay) ?? [])].sort(
          (a, b) =>
            Number(b.user === myId) - Number(a.user === myId) ||
            a.start.getTime() - b.start.getTime(),
        )
      : [],
  );

  const myEntries = $derived(entries.filter((e) => e.user === myId));

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
      const from = new Date(CREW_WINDOW_START);
      from.setHours(0, 0, 0, 0);
      const to = new Date(CREW_WINDOW_END);
      to.setHours(23, 59, 59, 999);
      const [rows, people] = await Promise.all([
        pb.collection('crew_availability').getFullList({
          filter: pb.filter('start_at >= {:from} && start_at <= {:to}', { from, to }),
          sort: 'start_at',
        }),
        listCrewMembers().catch(() => [] as CrewMember[]),
      ]);
      entries = rows.map((r) => {
        const start = parsePbDate(r.start_at);
        return {
          id: r.id,
          user: r.user,
          start,
          end: parsePbDate(r.end_at),
          day: isoDay(start),
          kind: r.kind as Kind,
          note: r.note ?? '',
        };
      });
      members = new Map(people.map((m) => [m.id, m]));
    } catch (err) {
      console.error('[crew/kalender] load failed', err);
      errorMsg = errorMessage(err, 'Konnte den Kalender nicht laden.');
    } finally {
      loading = false;
    }
  }

  function selectDay(iso: string) {
    selectedDay = selectedDay === iso ? '' : iso;
  }

  function openNew(iso: string) {
    editId = null;
    formDay = iso;
    formKind = 'all_day';
    formStart = '09:00';
    formEnd = '17:00';
    formNote = '';
    formError = null;
    formOpen = true;
  }

  function openEdit(e: Entry) {
    editId = e.id;
    formDay = e.day;
    formKind = e.kind;
    formStart = e.kind === 'window' ? hhmm(e.start) : '09:00';
    formEnd = e.kind === 'window' ? hhmm(e.end) : '17:00';
    formNote = e.note;
    formError = null;
    formOpen = true;
  }

  function hhmm(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function closeForm() {
    if (saving) return;
    formOpen = false;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const pb = auth.pb;
    if (!pb || !myId || !formDay) return;
    formError = null;

    let start_at: string;
    let end_at: string;
    if (formKind === 'all_day') {
      start_at = localDateTimeIso(formDay, '00:00');
      end_at = localDateTimeIso(formDay, '23:59');
    } else {
      start_at = localDateTimeIso(formDay, formStart);
      end_at = localDateTimeIso(formDay, formEnd);
      if (new Date(end_at) <= new Date(start_at)) {
        formError = 'Das Ende muss nach dem Start liegen.';
        return;
      }
    }

    saving = true;
    const day = formDay;
    try {
      const data = { start_at, end_at, kind: formKind, note: formNote.trim() };
      if (editId) {
        await pb.collection('crew_availability').update(editId, data);
      } else {
        await pb.collection('crew_availability').create({ ...data, user: myId });
      }
      formOpen = false;
      await load();
      selectedDay = day;
    } catch (err) {
      console.error('[crew/kalender] save failed', err);
      formError = errorMessage(err, 'Konnte den Eintrag nicht speichern.');
    } finally {
      saving = false;
    }
  }

  async function deleteEntry(e: Entry) {
    const pb = auth.pb;
    if (!pb) return;
    const question =
      e.user === myId
        ? 'Eintrag wirklich loeschen?'
        : `Eintrag von ${memberName(members.get(e.user))} wirklich loeschen?`;
    if (!confirm(question)) return;
    deleting = e.id;
    errorMsg = null;
    try {
      await pb.collection('crew_availability').delete(e.id);
      entries = entries.filter((x) => x.id !== e.id);
      if (editId === e.id) formOpen = false;
    } catch (err) {
      console.error('[crew/kalender] delete failed', err);
      errorMsg = errorMessage(err, 'Konnte den Eintrag nicht loeschen.');
    } finally {
      deleting = null;
    }
  }

  function timeLabel(e: Entry): string {
    return e.kind === 'all_day' ? 'Ganzer Tag' : `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
  }

  function shortDay(iso: string): string {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  }
</script>

<svelte:head>
  <title>Crew-Kalender</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 md:py-16">
  <BackLink />
  <h1 class="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">Crew-Kalender</h1>
  <p class="mt-3 max-w-2xl text-fg-muted">
    Wer ist wann da? 14 Tage vor und nach dem Festival. Tippe auf einen Tag, um die Eintraege zu
    sehen{canWrite ? ' oder dich einzutragen' : ''}. Der Festivaltag ist hervorgehoben.
  </p>

  {#if !canRead}
    <NoAccess area="den Crew-Kalender" />
  {:else}
    {#if errorMsg}
      <p class="card mt-6 p-4 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    {#if loading}
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="card h-80 animate-pulse opacity-50"></div>
        <div class="card h-80 animate-pulse opacity-50"></div>
      </div>
    {:else}
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        {#each CREW_CALENDAR_MONTHS as m (m.year + '-' + m.month)}
          <CalendarMonth
            year={m.year}
            month={m.month}
            {countsByDay}
            {myDays}
            selected={selectedDay}
            onDayClick={selectDay}
          />
        {/each}
      </div>

      <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
        <span>Zahl im Tag: Anzahl Eintraege</span>
        <span><span class="text-accent">Akzentfarbe</span>: du bist eingetragen</span>
      </div>

      {#if selectedDay}
        <section class="card mt-6 p-6" aria-live="polite">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold tracking-tight text-fg">
              {fmtLongDay(selectedDay)}
            </h2>
            {#if canWrite}
              <Button onclick={() => openNew(selectedDay)}>Eintragen</Button>
            {/if}
          </div>

          {#if selectedEntries.length === 0}
            <p class="mt-4 text-sm text-fg-muted">Noch niemand eingetragen.</p>
          {:else}
            <ul class="mt-5 flex flex-col gap-2">
              {#each selectedEntries as e (e.id)}
                {@const mine = e.user === myId}
                <li class="entry" class:mine>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm">
                      <span class="font-medium" class:text-accent={mine} class:text-fg={!mine}>
                        {memberName(members.get(e.user))}{mine ? ' (du)' : ''}
                      </span>
                      <span class="text-fg-muted"> · {timeLabel(e)}</span>
                    </p>
                    {#if e.note}
                      <p class="mt-1 break-words text-xs text-fg-muted">{e.note}</p>
                    {/if}
                  </div>
                  <div class="flex shrink-0 gap-1">
                    {#if mine && canWrite}
                      <button type="button" class="link" onclick={() => openEdit(e)}>
                        Bearbeiten
                      </button>
                    {/if}
                    {#if (mine && canWrite) || canDeleteAny}
                      <button
                        type="button"
                        class="link danger"
                        disabled={deleting === e.id}
                        onclick={() => deleteEntry(e)}
                      >
                        {deleting === e.id ? '…' : 'Loeschen'}
                      </button>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {:else}
        <p class="mt-6 text-center text-sm text-fg-muted">
          Tag im Kalender antippen, um Eintraege zu sehen.
        </p>
      {/if}

      {#if myEntries.length > 0}
        <section class="mt-10">
          <h2 class="text-lg font-semibold tracking-tight text-fg">Deine Eintraege</h2>
          <ul class="mt-3 flex flex-col gap-2">
            {#each myEntries as e (e.id)}
              <li class="entry mine">
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left"
                  onclick={() => selectDay(e.day)}
                >
                  <span class="text-sm font-medium text-fg">{shortDay(e.day)}</span>
                  <span class="text-sm text-fg-muted"> · {timeLabel(e)}</span>
                  {#if e.note}
                    <span class="block break-words text-xs text-fg-muted">{e.note}</span>
                  {/if}
                </button>
                {#if canWrite}
                  <button type="button" class="link" onclick={() => openEdit(e)}>Bearbeiten</button>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/if}
  {/if}
</div>

{#if formOpen}
  <Sheet
    eyebrow={editId ? 'Eintrag bearbeiten' : 'Verfuegbarkeit eintragen'}
    title={fmtLongDay(formDay)}
    onclose={closeForm}
  >
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <Segmented
        label="Art der Verfuegbarkeit"
        full
        options={[
          { value: 'all_day', label: 'Ganzer Tag' },
          { value: 'window', label: 'Zeitfenster' },
        ]}
        bind:value={formKind}
      />

      {#if formKind === 'window'}
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-medium text-fg-muted">Von</span>
            <input type="time" bind:value={formStart} required class="field mt-2" />
          </label>
          <label class="block">
            <span class="text-xs font-medium text-fg-muted">Bis</span>
            <input type="time" bind:value={formEnd} required class="field mt-2" />
          </label>
        </div>
      {/if}

      <label class="block">
        <span class="text-xs font-medium text-fg-muted">Notiz (optional)</span>
        <input
          type="text"
          bind:value={formNote}
          maxlength="200"
          placeholder="z.B. Aufbau Mainstage"
          class="field mt-2"
        />
      </label>

      {#if formError}
        <p class="text-sm text-danger" role="alert">{formError}</p>
      {/if}

      <div class="flex flex-wrap gap-3 pt-1">
        <Button type="submit" disabled={saving}>{saving ? 'Speichere …' : 'Speichern'}</Button>
        <Button variant="ghost" onclick={closeForm} disabled={saving}>Abbrechen</Button>
      </div>
    </form>
  </Sheet>
{/if}

<style>
  .entry {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-md);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .entry.mine {
    border-color: var(--color-accent-glow);
  }
  .link {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-accent);
    transition: background-color var(--dur-hover) var(--ease-out);
  }
  .link:hover {
    background-color: var(--glass-bg-strong);
  }
  .link.danger {
    color: var(--color-fg-muted);
  }
  .link.danger:hover {
    color: var(--color-danger);
  }
  .link:disabled {
    opacity: 0.5;
  }
</style>
