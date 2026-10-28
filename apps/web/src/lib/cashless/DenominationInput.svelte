<script lang="ts">
  import { DENOMINATIONS } from '$lib/denominations';
  import { countsTotal, formatEur } from './summary';
  import { t } from '$lib/i18n';

  interface Props {
    counts: Record<number, number>;
    disabled?: boolean;
    totalLabel?: string;
  }

  let {
    counts = $bindable(),
    disabled = false,
    totalLabel = t('Summe', 'Total'),
  }: Props = $props();

  const total = $derived(countsTotal(counts));
  const groups = [
    { label: t('Scheine', 'Notes'), items: DENOMINATIONS.filter((d) => d.type === 'note') },
    { label: t('Muenzen', 'Coins'), items: DENOMINATIONS.filter((d) => d.type === 'coin') },
  ];

  function setCount(cents: number, raw: string) {
    const n = Math.max(0, Math.min(9999, parseInt(raw, 10) || 0));
    counts = { ...counts, [cents]: n };
  }
</script>

<div class="flex flex-col gap-5">
  {#each groups as g (g.label)}
    <fieldset>
      <legend class="text-xs font-medium text-fg-muted">{g.label}</legend>
      <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-8">
        {#each g.items as d (d.cents)}
          <label class="block">
            <span class="block text-xs font-medium text-fg">{d.label}</span>
            <input
              type="number"
              inputmode="numeric"
              min="0"
              max="9999"
              step="1"
              placeholder="0"
              value={counts[d.cents] || ''}
              oninput={(e) => setCount(d.cents, e.currentTarget.value)}
              onfocus={(e) => e.currentTarget.select()}
              {disabled}
              class="field mt-1 text-center tabular-nums"
            />
          </label>
        {/each}
      </div>
    </fieldset>
  {/each}

  <div class="flex items-baseline justify-between border-t border-[var(--glass-border)] pt-3">
    <span class="text-sm text-fg-muted">{totalLabel}</span>
    <span class="text-2xl font-semibold tabular-nums text-accent">{formatEur(total)}</span>
  </div>
</div>
