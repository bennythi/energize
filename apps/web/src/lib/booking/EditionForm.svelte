<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { errorMessage } from '$lib/crew-api';
  import type { Edition } from '$lib/booking';

  // Gemeinsames Formular fuer Editionen (DJ-Planung + Kostenplanung).
  interface Props {
    /** Bestehende Edition bearbeiten oder null fuer eine neue. */
    edition: Edition | null;
    onSaved: (edition: Edition, isNew: boolean) => void;
    onCancel: () => void;
  }
  let { edition, onSaved, onCancel }: Props = $props();

  // Startwerte einmalig aus der Edition (die Komponente wird je Edition neu gemountet).
  const e0 = untrack(() => edition);
  const nextYear = new Date().getFullYear() + 1;
  let name = $state(e0?.name ?? `Edition ${nextYear}`);
  let year = $state(e0?.year ?? nextYear);
  let start = $state(e0?.start_date ?? '');
  let end = $state(e0?.end_date ?? '');
  let setupDays = $state(e0?.setup_days ?? 2);
  let teardownDays = $state(e0?.teardown_days ?? 1);
  let artistBudget = $state<number | null>(e0 && e0.budget > 0 ? e0.budget : null);
  let totalBudget = $state<number | null>(e0 && e0.total_budget > 0 ? e0.total_budget : null);
  let saving = $state(false);
  let errorMsg = $state<string | null>(null);

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!auth.pb) return;
    if (start && end && end < start) {
      errorMsg = 'Das Enddatum liegt vor dem Startdatum.';
      return;
    }
    saving = true;
    errorMsg = null;
    const data = {
      name: name.trim() || `Edition ${year}`,
      year,
      start_date: start,
      end_date: end || start,
      setup_days: Number(setupDays) || 0,
      teardown_days: Number(teardownDays) || 0,
      budget: artistBudget ?? 0,
      total_budget: totalBudget ?? 0,
      currency: edition?.currency || 'EUR',
    };
    try {
      const rec = edition
        ? await auth.pb.collection('booking_editions').update(edition.id, data)
        : await auth.pb.collection('booking_editions').create({ ...data, archived: false });
      onSaved(rec as unknown as Edition, !edition);
    } catch (err) {
      errorMsg = errorMessage(err, 'Edition konnte nicht gespeichert werden.');
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={save} class="card mt-8 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
  <label class="block sm:col-span-2">
    <span class="text-xs font-medium text-fg-muted">Name</span>
    <input class="field mt-1" bind:value={name} required maxlength="120" />
  </label>
  <label class="block">
    <span class="text-xs font-medium text-fg-muted">Jahr</span>
    <input class="field mt-1" type="number" min="2000" max="2100" bind:value={year} />
  </label>
  <div class="hidden lg:block"></div>
  <label class="block">
    <span class="text-xs font-medium text-fg-muted">Erster Festivaltag</span>
    <input class="field mt-1" type="date" bind:value={start} />
  </label>
  <label class="block">
    <span class="text-xs font-medium text-fg-muted">Letzter Festivaltag</span>
    <input class="field mt-1" type="date" bind:value={end} min={start || undefined} />
  </label>
  <label class="block">
    <span class="text-xs font-medium text-fg-muted">Aufbautage davor</span>
    <input class="field mt-1" type="number" min="0" max="14" bind:value={setupDays} />
  </label>
  <label class="block">
    <span class="text-xs font-medium text-fg-muted">Abbautage danach</span>
    <input class="field mt-1" type="number" min="0" max="14" bind:value={teardownDays} />
  </label>
  <label class="block sm:col-span-2">
    <span class="text-xs font-medium text-fg-muted">Gesamtbudget Festival (EUR, optional)</span>
    <input class="field mt-1" type="number" min="0" step="100" bind:value={totalBudget} />
  </label>
  <label class="block sm:col-span-2">
    <span class="text-xs font-medium text-fg-muted">Davon Budget Artists (EUR, optional)</span>
    <input class="field mt-1" type="number" min="0" step="50" bind:value={artistBudget} />
  </label>
  {#if errorMsg}
    <p class="text-sm text-danger sm:col-span-2 lg:col-span-4" role="alert">{errorMsg}</p>
  {/if}
  <div class="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
    <Button variant="ghost" onclick={onCancel}>Abbrechen</Button>
    <Button type="submit" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
  </div>
</form>
