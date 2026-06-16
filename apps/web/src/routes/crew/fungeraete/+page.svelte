<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { CREW_WINDOW_START, CREW_WINDOW_END, FESTIVAL_DAY, isoDay } from '$lib/festival';
  import { CREW_RESOURCES } from '$lib/crewResources';

  type Equipment = 'razor' | 'headphones' | 'inear';

  interface Request {
    id: string;
    user_id: string;
    event_day: string;
    equipment: Equipment;
    note: string | null;
  }

  interface Member {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_path: string | null;
  }

  const EQUIPMENT_LABEL: Record<Equipment, string> = {
    razor: 'Rasierer',
    headphones: 'Kopfhörer',
    inear: 'InEar',
  };

  const EQUIPMENT_VALUES: Equipment[] = ['razor', 'headphones', 'inear'];

  let requests = $state<Request[]>([]);
  let members = $state<Map<string, Member>>(new Map());
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let formDay = $state<string>('');
  let formEquipment = $state<Equipment>('headphones');
  let formNote = $state('');
  let saving = $state(false);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (!auth.loading && !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
      return;
    }
    if (!auth.canRead(CREW_RESOURCES.fungeraete) && auth.adminChecked) {
      void goto('/crew', { replaceState: true });
    }
  });

  const days = $derived.by(() => {
    const result: { iso: string; date: Date; isFestival: boolean }[] = [];
    const cursor = new Date(CREW_WINDOW_START);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= CREW_WINDOW_END) {
      const iso = isoDay(cursor);
      result.push({ iso, date: new Date(cursor), isFestival: iso === FESTIVAL_DAY });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });

  const requestsByDay = $derived.by(() => {
    const buckets = new Map<string, Request[]>();
    for (const r of requests) {
      const arr = buckets.get(r.event_day) ?? [];
      arr.push(r);
      buckets.set(r.event_day, arr);
    }
    return buckets;
  });

  const myDays = $derived(
    new Set(requests.filter((r) => r.user_id === auth.user?.id).map((r) => r.event_day)),
  );

  // Bestellempfehlung: Peak-Bedarf pro Equipment über das gesamte
  // Crew-Window. Wir bestellen nicht pro Tag, sondern für die ganze
  // Zeit. Maximaler Tagesbedarf bestimmt die Stückzahl, weil parallel
  // genutzt wird (keine Tagesweiterreichung).
  let reserveBuffer = $state(20); // Prozent zusaetzlicher Buffer

  const peakDemand = $derived.by(() => {
    const peak: Record<Equipment, number> = { razor: 0, headphones: 0, inear: 0 };
    for (const [, dayReqs] of requestsByDay.entries()) {
      for (const eq of EQUIPMENT_VALUES) {
        const count = dayReqs.filter((r) => r.equipment === eq).length;
        if (count > peak[eq]) peak[eq] = count;
      }
    }
    return peak;
  });

  const orderRecommendation = $derived.by(() => {
    const factor = 1 + reserveBuffer / 100;
    return {
      razor: Math.ceil(peakDemand.razor * factor),
      headphones: Math.ceil(peakDemand.headphones * factor),
      inear: Math.ceil(peakDemand.inear * factor),
    };
  });

  const totalOrder = $derived(
    orderRecommendation.razor + orderRecommendation.headphones + orderRecommendation.inear,
  );

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const [reqRes, memRes] = await Promise.all([
        client
          .from('crew_equipment_requests')
          .select('id, user_id, event_day, equipment, note')
          .gte('event_day', isoDay(CREW_WINDOW_START))
          .lte('event_day', isoDay(CREW_WINDOW_END))
          .order('event_day', { ascending: true }),
        client.rpc('crew_list_members'),
      ]);
      if (reqRes.error) throw reqRes.error;
      requests = (reqRes.data ?? []) as Request[];
      const map = new Map<string, Member>();
      for (const m of memRes.data ?? []) {
        map.set(m.id, {
          id: m.id,
          display_name: m.display_name,
          handle: m.handle,
          avatar_path: m.avatar_path,
        });
      }
      members = map;
    } catch (err) {
      console.error('[crew/fungeraete] load failed', err);
      errorMsg = 'Konnte die Liste nicht laden. Migration 0013 gelaufen?';
    } finally {
      loading = false;
    }
  }

  function memberLabel(userId: string): string {
    const m = members.get(userId);
    if (!m) return 'Crew';
    return m.display_name || (m.handle ? `@${m.handle}` : 'Crew');
  }

  function fmtDate(d: Date): string {
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  function openForm(iso: string) {
    formDay = iso;
    formEquipment = 'headphones';
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
      const { error } = await client.from('crew_equipment_requests').upsert(
        {
          user_id: user.id,
          event_day: formDay,
          equipment: formEquipment,
          note: formNote.trim() || null,
        },
        { onConflict: 'user_id,event_day' },
      );
      if (error) throw error;
      closeForm();
      await load();
    } catch (err) {
      console.error('[crew/fungeraete] insert failed', err);
      errorMsg = 'Konnte den Eintrag nicht speichern.';
    } finally {
      saving = false;
    }
  }

  async function deleteRequest(id: string) {
    const client = auth.client;
    if (!client) return;
    if (!confirm('Anforderung wirklich löschen?')) return;
    try {
      const { error } = await client.from('crew_equipment_requests').delete().eq('id', id);
      if (error) throw error;
      requests = requests.filter((r) => r.id !== id);
    } catch (err) {
      console.error('[crew/fungeraete] delete failed', err);
    }
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Crew · Funkgeräte · ENERGIZE</title>
</svelte:head>

<section class="border-b border-border bg-bg">
  <Container>
    <div class="py-12 md:py-16">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        ⚡ Crew / Funkgeräte
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        Welches Headset brauchst du.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-fg-muted">
        Pro Tag eine Wahl: Rasierer, Kopfhörer oder InEar. Ein Eintrag pro Tag.
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
      <p class="text-fg-muted">Lade ...</p>
    {:else}
      <ul class="divide-y divide-border border-y border-border">
        {#each days as day (day.iso)}
          {@const dayReqs = requestsByDay.get(day.iso) ?? []}
          {@const counts = {
            razor: dayReqs.filter((r) => r.equipment === 'razor').length,
            headphones: dayReqs.filter((r) => r.equipment === 'headphones').length,
            inear: dayReqs.filter((r) => r.equipment === 'inear').length,
          }}
          <li
            class="grid grid-cols-[120px_1fr_auto] gap-4 p-4 transition-colors hover:bg-surface md:grid-cols-[160px_1fr_auto]"
            class:bg-surface={day.isFestival}
            class:border-l-4={day.isFestival}
            class:border-accent={day.isFestival}
          >
            <div>
              <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
                {day.isFestival
                  ? '⚡ Festival'
                  : day.date.toLocaleDateString('de-DE', { weekday: 'short' })}
              </p>
              <p
                class="mt-1 font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {fmtDate(day.date)}
              </p>
            </div>
            <div>
              {#if dayReqs.length === 0}
                <p class="text-sm text-fg-muted">Niemand braucht hier was.</p>
              {:else}
                <div
                  class="mb-2 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {#if counts.razor > 0}<span
                      ><span class="font-black tabular-nums text-fg">{counts.razor}</span> Rasierer</span
                    >{/if}
                  {#if counts.headphones > 0}<span
                      ><span class="font-black tabular-nums text-fg">{counts.headphones}</span> Kopfhörer</span
                    >{/if}
                  {#if counts.inear > 0}<span
                      ><span class="font-black tabular-nums text-fg">{counts.inear}</span> InEar</span
                    >{/if}
                </div>
                <ul class="space-y-2">
                  {#each dayReqs as r (r.id)}
                    {@const mine = r.user_id === auth.user?.id}
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
                          {memberLabel(r.user_id)}{mine ? ' · du' : ''}
                        </span>
                        <span class="text-fg-muted">·</span>
                        <span class="text-fg">{EQUIPMENT_LABEL[r.equipment]}</span>
                        {#if r.note}<p class="mt-1 text-xs text-fg-muted">{r.note}</p>{/if}
                      </div>
                      {#if mine}
                        <button
                          onclick={() => deleteRequest(r.id)}
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
            <div class="self-center">
              <button
                onclick={() => openForm(day.iso)}
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
              >
                {myDays.has(day.iso) ? 'ändern' : '+ anfordern'}
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <!-- Bestellempfehlung jetzt unter der Tagesliste -->
      <div class="mt-10 border-2 border-accent bg-surface p-5 md:p-6">
        <div class="flex items-baseline justify-between gap-3">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            Bestellempfehlung
          </p>
          <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Peak-Tag × {1 + reserveBuffer / 100}
          </p>
        </div>
        <h2
          class="mt-2 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
        >
          {totalOrder} Geräte für die gesamte Festival-Zeit
        </h2>
        <p class="mt-1 text-xs text-fg-muted">
          Wir mieten für die gesamte Crew-Zeit. Maximalbedarf eines einzelnen Tages = Bestellmenge,
          weil Geräte nicht von Tag zu Tag weitergereicht werden können.
        </p>

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="border-l-4 border-accent bg-bg p-3">
            <p
              class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Rasierer
            </p>
            <p class="mt-1 font-display text-3xl font-black tabular-nums leading-none text-fg">
              {orderRecommendation.razor}
            </p>
            <p class="mt-1 font-mono text-[10px] text-fg-muted">
              Peak {peakDemand.razor} · +{reserveBuffer}% Reserve
            </p>
          </div>
          <div class="border-l-4 border-accent bg-bg p-3">
            <p
              class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Kopfhörer
            </p>
            <p class="mt-1 font-display text-3xl font-black tabular-nums leading-none text-fg">
              {orderRecommendation.headphones}
            </p>
            <p class="mt-1 font-mono text-[10px] text-fg-muted">
              Peak {peakDemand.headphones} · +{reserveBuffer}% Reserve
            </p>
          </div>
          <div class="border-l-4 border-accent bg-bg p-3">
            <p
              class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              InEar
            </p>
            <p class="mt-1 font-display text-3xl font-black tabular-nums leading-none text-fg">
              {orderRecommendation.inear}
            </p>
            <p class="mt-1 font-mono text-[10px] text-fg-muted">
              Peak {peakDemand.inear} · +{reserveBuffer}% Reserve
            </p>
          </div>
        </div>

        <div class="mt-5 flex items-center gap-3">
          <label
            for="reserve"
            class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >
            Reserve-Buffer
          </label>
          <input
            id="reserve"
            type="range"
            min="0"
            max="50"
            step="5"
            bind:value={reserveBuffer}
            class="flex-1 accent-[var(--color-accent)]"
          />
          <span class="font-mono text-xs tabular-nums text-accent">+{reserveBuffer}%</span>
        </div>

        {#if totalOrder === 0}
          <p
            class="mt-4 border-l-2 border-fg-muted bg-bg p-3 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >
            Noch keine Anforderungen. Sobald die Crew sich eintraegt, fuellt sich der Bedarf hier.
          </p>
        {/if}
      </div>
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
        Funkgerät anfordern
      </p>
      <h2 class="mt-2 font-display text-2xl font-black uppercase text-fg">
        {new Date(formDay).toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </h2>

      <form onsubmit={handleSubmit} class="mt-6 space-y-4">
        <fieldset class="grid grid-cols-3 gap-2">
          {#each EQUIPMENT_VALUES as eq (eq)}
            <label>
              <input type="radio" bind:group={formEquipment} value={eq} class="peer sr-only" />
              <span
                class="block cursor-pointer border-2 border-border p-3 text-center font-mono text-xs uppercase tracking-[var(--tracking-claim)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-fg-inverse"
              >
                {EQUIPMENT_LABEL[eq]}
              </span>
            </label>
          {/each}
        </fieldset>

        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Notiz (optional)
          </span>
          <input
            type="text"
            bind:value={formNote}
            maxlength="200"
            placeholder="z.B. Allergie, Wunschmarke"
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
