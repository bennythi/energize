<script lang="ts">
  import { monthGrid, WEEKDAY_LABELS_DE, MONTH_LABELS_DE } from '$lib/festival';

  interface Props {
    year: number;
    month: number;
    countsByDay: Map<string, number>;
    myDays: Set<string>;
    onDayClick: (iso: string) => void;
  }

  let { year, month, countsByDay, myDays, onDayClick }: Props = $props();

  const cells = $derived(monthGrid(year, month));
</script>

<div class="border-2 border-border bg-bg">
  <header class="flex items-baseline justify-between border-b border-border p-3">
    <h3 class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg">
      {MONTH_LABELS_DE[month]}
      {year}
    </h3>
  </header>

  <div class="grid grid-cols-7 gap-px bg-border">
    {#each WEEKDAY_LABELS_DE as label (label)}
      <div
        class="bg-bg p-2 text-center font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {label}
      </div>
    {/each}
    {#each cells as cell (cell.iso)}
      {@const count = countsByDay.get(cell.iso) ?? 0}
      {@const mine = myDays.has(cell.iso)}
      {#if cell.isPadding}
        <div class="bg-surface/30 p-2 text-fg-muted/40">
          <span class="font-mono text-xs">{cell.day}</span>
        </div>
      {:else if !cell.isInWindow}
        <div class="bg-surface p-2">
          <span class="font-mono text-xs text-fg-muted/60">{cell.day}</span>
        </div>
      {:else}
        <button
          type="button"
          onclick={() => onDayClick(cell.iso)}
          class="group relative flex min-h-[64px] flex-col items-stretch bg-bg p-2 text-left transition-colors hover:bg-surface"
          class:bg-accent={cell.isFestival}
          class:hover:bg-accent={cell.isFestival}
        >
          <span
            class="font-mono text-xs font-bold"
            class:text-fg-inverse={cell.isFestival}
            class:text-accent={mine && !cell.isFestival}
            class:text-fg={!mine && !cell.isFestival}
          >
            {cell.day}
            {#if cell.isFestival}
              <span class="ml-1 text-[10px] uppercase">⚡ Festival</span>
            {/if}
          </span>
          {#if count > 0}
            <span
              class="mt-auto self-end font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
              class:text-fg-inverse={cell.isFestival}
              class:text-accent={!cell.isFestival && mine}
              class:text-fg-muted={!cell.isFestival && !mine}
            >
              {count}× {mine ? 'inkl. du' : 'Crew'}
            </span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>
