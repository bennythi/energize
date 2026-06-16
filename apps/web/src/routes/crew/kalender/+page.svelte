<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_WINDOW_START, CREW_WINDOW_END, CREW_CALENDAR_MONTHS, isoDay } from '$lib/festival';
  import { CREW_RESOURCES } from '$lib/crewResources';
  import MonthGrid from '$lib/MonthGrid.svelte';

  interface Entry {
    id: string;
    user_id: string;
    start_at: string;
    end_at: string;
    kind: 'all_day' | 'window';
    note: string | null;
  }

  interface Member {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
  }

  let entries = $state<Entry[]>([]);
  let members = $state<Map<string, Member>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let selectedDay = $state<string>('');
  let formDay = $state<string>('');
  let formKind = $state<'all_day' | 'window'>('all_day');
  let formStart = $state('09:00');
  let formEnd = $state('17:00');
  let formNote = $state('');
  let saving = $state(false);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.canRead(CREW_RESOURCES.kalender) && auth.adminChecked) {
      void goto('/crew', { replaceState: true });
    }
  });

  const entriesByDay = $derived.by(() => {
    const buckets = new Map<string, Entry[]>();
    for (const e of entries) {
      const dayKey = isoDay(new Date(e.start_at));
      const arr = buckets.get(dayKey) ?? [];
      arr.push(e);
      buckets.set(dayKey, arr);
    }
    return buckets;
  });

  const countsByDay = $derived.by(() => {
    const m = new Map<string, number>();
    for (const [iso, list] of entriesByDay.entries()) {
      m.set(iso, list.length);
    }
    return m;
  });

  const myDays = $derived(
    new Set(
      entries.filter((e) => e.user_id === auth.user?.id).map((e) => isoDay(new Date(e.start_at))),
    ),
  );

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const [entriesRes, membersRes] = await Promise.all([
        client
          .from('crew_availability')
          .select('id, user_id, start_at, end_at, kind, note')
          .gte('start_at', CREW_WINDOW_START.toISOString())
          .lte('start_at', CREW_WINDOW_END.toISOString())
          .order('start_at', { ascending: true }),
        client.rpc('crew_list_members'),
      ]);
      if (entriesRes.error) throw entriesRes.error;
      entries = (entriesRes.data ?? []) as Entry[];
      const map = new Map<string, Member>();
      for (const m of membersRes.data ?? []) {
        map.set(m.id, {
          id: m.id,
          display_name: m.display_name,
          handle: m.handle,
          avatar_path: m.avatar_path,
        });
      }
      members = map;
    } catch (err) {
      console.error('[crew/kalender] load failed', err);
      errorMsg = 'Konnte den Kalender nicht laden. Migration 0013 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function memberLabel(userId: string): string {
    const m = members.get(userId);
    if (!m) return 'Crew';
    return m.display_name || (m.handle ? `@${m.handle}` : 'Crew');
  }

  function fmtTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function selectDay(iso: string) {
    selectedDay = selectedDay === iso ? '' : iso;
  }

  function openForm(iso: string) {
    formDay = iso;
    formKind = 'all_day';
    formStart = '09:00';
    formEnd = '17:00';
    formNote = '';
    errorMsg = null;
  }

  function closeForm() {
    formDay = '';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !formDay) return;
    saving = true;
    errorMsg = null;
    try {
      let startIso: string;
      let endIso: string;
      if (formKind === 'all_day') {
        startIso = `${formDay}T00:00:00+02:00`;
        endIso = `${formDay}T23:59:00+02:00`;
      } else {
        startIso = `${formDay}T${formStart}:00+02:00`;
        endIso = `${formDay}T${formEnd}:00+02:00`;
        if (new Date(endIso) <= new Date(startIso)) {
          errorMsg = 'Ende muss nach dem Start liegen.';
          saving = false;
          return;
        }
      }
      const { error } = await client.from('crew_availability').insert({
        user_id: user.id,
        start_at: startIso,
        end_at: endIso,
        kind: formKind,
        note: formNote.trim() || null,
      });
      if (error) throw error;
      const inserted = formDay;
      closeForm();
      await load();
      selectedDay = inserted;
    } catch (err) {
      console.error('[crew/kalender] insert failed', err);
      errorMsg = 'Konnte den Eintrag nicht speichern.';
    } finally {
      saving = false;
    }
  }

  async function deleteEntry(id: string) {
    const client = auth.client;
    if (!client) return;
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      const { error } = await client.from('crew_availability').delete().eq('id', id);
      if (error) throw error;
      entries = entries.filter((e) => e.id !== id);
    } catch (err) {
      console.error('[crew/kalender] delete failed', err);
    }
  }

  const selectedEntries = $derived(selectedDay ? (entriesByDay.get(selectedDay) ?? []) : []);

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Crew-Kalender · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-12 md:py-16">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Kalender
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        Wann bist du da.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-fg-muted">
        14 Tage vor und nach dem Festival. Klick auf einen Tag, um einen Eintrag zu sehen oder
        anzulegen. Festivaltag ist gelb hervorgehoben.
      </p>
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
      <p class="text-fg-muted">Lade Kalender ...</p>
    {:else}
      <div class="grid gap-6 md:grid-cols-2">
        {#each CREW_CALENDAR_MONTHS as m (m.year + '-' + m.month)}
          <MonthGrid year={m.year} month={m.month} {countsByDay} {myDays} onDayClick={selectDay} />
        {/each}
      </div>

      <!-- Detail-Block für ausgewählten Tag -->
      {#if selectedDay}
        <div class="mt-8 border-l-4 border-accent bg-surface p-5">
          <div class="flex items-baseline justify-between gap-3">
            <h2
              class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
            >
              {fmtFullDate(selectedDay)}
            </h2>
            <Button variant="ghost" onclick={() => openForm(selectedDay)}>+ eintragen</Button>
          </div>

          {#if selectedEntries.length === 0}
            <p class="mt-4 text-sm text-fg-muted">Noch niemand eingetragen.</p>
          {:else}
            <ul class="mt-4 space-y-2">
              {#each selectedEntries as e (e.id)}
                {@const mine = e.user_id === auth.user?.id}
                <li
                  class="flex items-start justify-between gap-3 border-l-2 pl-3 text-sm"
                  class:border-accent={mine}
                  class:border-fg-muted={!mine}
                >
                  <div>
                    <span
                      class="font-mono uppercase tracking-[var(--tracking-claim)]"
                      class:text-accent={mine}
                    >
                      {memberLabel(e.user_id)}{mine ? ' · du' : ''}
                    </span>
                    <span class="text-fg-muted">·</span>
                    <span class="text-fg">
                      {#if e.kind === 'all_day'}
                        ganzer Tag
                      {:else}
                        {fmtTime(e.start_at)}–{fmtTime(e.end_at)}
                      {/if}
                    </span>
                    {#if e.note}
                      <p class="mt-1 text-xs text-fg-muted">{e.note}</p>
                    {/if}
                  </div>
                  {#if mine}
                    <button
                      onclick={() => deleteEntry(e.id)}
                      class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-[var(--color-red,#E24B4A)]"
                    >
                      löschen
                    </button>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {:else}
        <p
          class="mt-8 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
        >
          Tag im Kalender anklicken, um Eintraege zu sehen.
        </p>
      {/if}
    {/if}
  </section>
</Container>

{#if formDay}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 md:items-center"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-md border-2 border-accent bg-bg p-6">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Verfügbarkeit eintragen
      </p>
      <h2 class="mt-2 font-display text-2xl font-black uppercase text-fg">
        {fmtFullDate(formDay)}
      </h2>

      <form onsubmit={handleSubmit} class="mt-6 space-y-4">
        <fieldset class="flex gap-2">
          <label class="flex-1">
            <input type="radio" bind:group={formKind} value="all_day" class="peer sr-only" />
            <span
              class="block cursor-pointer border-2 border-border p-3 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-fg-inverse"
            >
              Ganzer Tag
            </span>
          </label>
          <label class="flex-1">
            <input type="radio" bind:group={formKind} value="window" class="peer sr-only" />
            <span
              class="block cursor-pointer border-2 border-border p-3 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-fg-inverse"
            >
              Zeitfenster
            </span>
          </label>
        </fieldset>

        {#if formKind === 'window'}
          <div class="grid grid-cols-2 gap-3">
            <label>
              <span
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                Von
              </span>
              <input
                type="time"
                bind:value={formStart}
                required
                class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-base text-fg focus:border-accent focus:outline-none"
              />
            </label>
            <label>
              <span
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                Bis
              </span>
              <input
                type="time"
                bind:value={formEnd}
                required
                class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-base text-fg focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        {/if}

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Notiz (optional)
          </span>
          <input
            type="text"
            bind:value={formNote}
            maxlength="200"
            placeholder="z.B. Aufbau Mainstage"
            class="mt-1 w-full border-2 border-border bg-bg px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </label>

        <div class="flex gap-3 pt-2">
          <Button type="submit" variant="yellow" disabled={saving}>
            {saving ? 'Speichere ...' : 'Speichern'}
          </Button>
          <Button variant="ghost" onclick={closeForm} disabled={saving}>Abbrechen</Button>
        </div>
      </form>
    </div>
  </div>
{/if}
