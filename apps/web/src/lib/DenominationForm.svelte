<script lang="ts">
  import { DENOMINATIONS, totalCents } from '$lib/denominations';

  interface Props {
    counts: Record<number, number>;
    onUpdate: (counts: Record<number, number>) => void;
    disabled?: boolean;
  }

  let { counts = $bindable(), onUpdate, disabled = false }: Props = $props();

  const total = $derived(totalCents(counts));

  function setCount(cents: number, raw: string) {
    const n = Math.max(0, Math.min(9999, parseInt(raw, 10) || 0));
    const next = { ...counts, [cents]: n };
    counts = next;
    onUpdate(next);
  }

  function eur(c: number): string {
    return (c / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }
</script>

<div>
  <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
    {#each DENOMINATIONS as d (d.cents)}
      <label class="block">
        <span
          class="block font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
          class:text-accent={d.type === 'note'}
          class:text-fg-muted={d.type === 'coin'}
        >
          {d.label}
        </span>
        <input
          type="number"
          min="0"
          max="9999"
          step="1"
          value={counts[d.cents] ?? 0}
          oninput={(e) => setCount(d.cents, (e.target as HTMLInputElement).value)}
          {disabled}
          class="mt-1 w-full border-2 border-border bg-bg px-2 py-1 text-center font-mono text-sm tabular-nums text-fg focus:border-accent focus:outline-none disabled:opacity-50"
        />
      </label>
    {/each}
  </div>

  <div class="mt-4 flex items-baseline justify-between border-t border-border pt-3">
    <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      Summe
    </span>
    <span class="font-display text-2xl font-black tabular-nums text-accent">
      {eur(total)}
    </span>
  </div>
</div>
