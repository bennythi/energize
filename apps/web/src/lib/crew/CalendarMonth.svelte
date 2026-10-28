<script lang="ts">
  // Monatsraster fuer den Crew-Kalender (neues Glas-Design).
  import { monthGrid, WEEKDAY_LABELS_DE, MONTH_LABELS_DE } from '$lib/festival';
  import { t } from '$lib/i18n';

  interface Props {
    year: number;
    month: number;
    countsByDay: Map<string, number>;
    myDays: Set<string>;
    selected?: string;
    onDayClick: (iso: string) => void;
  }

  let { year, month, countsByDay, myDays, selected = '', onDayClick }: Props = $props();

  const cells = $derived(monthGrid(year, month));
</script>

<div class="card p-4 md:p-5">
  <h3 class="px-1 text-lg font-semibold tracking-tight text-fg">
    {MONTH_LABELS_DE[month]}
    {year}
  </h3>

  <div class="mt-3 grid grid-cols-7 gap-1">
    {#each WEEKDAY_LABELS_DE as label (label)}
      <div class="pb-1 text-center text-[11px] font-medium text-fg-muted">{label}</div>
    {/each}
    {#each cells as cell (cell.iso)}
      {@const count = countsByDay.get(cell.iso) ?? 0}
      {@const mine = myDays.has(cell.iso)}
      {#if cell.isPadding}
        <div class="cell padding" aria-hidden="true"></div>
      {:else if !cell.isInWindow}
        <div class="cell outside">
          <span>{cell.day}</span>
        </div>
      {:else}
        <button
          type="button"
          class="cell day"
          class:festival={cell.isFestival}
          class:mine
          class:selected={selected === cell.iso}
          aria-pressed={selected === cell.iso}
          aria-label={t(
            `${cell.day}. ${MONTH_LABELS_DE[month]}: ${count} Eintraege${mine ? ', inklusive dir' : ''}`,
            `${cell.day} ${MONTH_LABELS_DE[month]}: ${count} entries${mine ? ', including you' : ''}`,
          )}
          onclick={() => onDayClick(cell.iso)}
        >
          <span class="num">{cell.day}</span>
          {#if count > 0}
            <span class="count">{count}</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 3.25rem;
    padding: 0.35rem 0.4rem;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    text-align: left;
  }
  .padding {
    visibility: hidden;
  }
  .outside {
    color: var(--color-fg-muted);
    opacity: 0.35;
  }
  .day {
    background-color: var(--glass-bg);
    border: 1px solid transparent;
    color: var(--color-fg);
    cursor: pointer;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      transform var(--dur-press) var(--ease-spring);
  }
  .day:active {
    transform: scale(0.95);
  }
  @media (hover: hover) and (pointer: fine) {
    .day:hover {
      background-color: var(--glass-bg-strong);
      border-color: var(--glass-border);
    }
  }
  .num {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .count {
    align-self: flex-end;
    min-width: 1.35rem;
    padding: 0.05rem 0.35rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg-strong);
    color: var(--color-fg-muted);
    font-size: 0.7rem;
    font-weight: 600;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .mine .num {
    color: var(--color-accent);
  }
  .mine .count {
    background-color: var(--color-accent-glow);
    color: var(--color-fg);
  }
  .festival {
    background-color: var(--color-accent);
    color: var(--color-fg-inverse);
  }
  .festival .num {
    color: var(--color-fg-inverse);
  }
  .festival .count {
    background-color: rgba(0, 0, 0, 0.2);
    color: var(--color-fg-inverse);
  }
  @media (hover: hover) and (pointer: fine) {
    .festival:hover {
      background-color: var(--color-accent);
      box-shadow: var(--shadow-glow);
    }
  }
  .selected {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-glow);
  }
  .festival.selected {
    border-color: var(--color-fg);
  }
  @media (min-width: 768px) {
    .cell {
      min-height: 3.75rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .day:active {
      transform: none;
    }
  }
</style>
