<script lang="ts">
  import { DENOMINATIONS } from '$lib/denominations';
  import { countsTotal, formatEur } from './summary';

  interface Props {
    counts: Record<number, number>;
  }

  let { counts }: Props = $props();

  const rows = $derived(DENOMINATIONS.filter((d) => (counts[d.cents] ?? 0) > 0));
</script>

{#if rows.length === 0}
  <p class="text-sm text-fg-muted">Keine Stueckelung erfasst.</p>
{:else}
  <ul class="divide-y divide-[var(--glass-border)] text-sm">
    {#each rows as d (d.cents)}
      <li class="flex items-baseline justify-between gap-3 py-1.5">
        <span class="text-fg">{counts[d.cents]} × {d.label}</span>
        <span class="tabular-nums text-fg-muted">{formatEur(counts[d.cents] * d.cents)}</span>
      </li>
    {/each}
    <li class="flex items-baseline justify-between gap-3 py-1.5 font-medium">
      <span class="text-fg">Summe</span>
      <span class="tabular-nums text-fg">{formatEur(countsTotal(counts))}</span>
    </li>
  </ul>
{/if}
