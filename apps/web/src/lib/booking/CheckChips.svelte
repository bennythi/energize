<script lang="ts">
  import {
    CHECK_KEYS,
    CHECK_LABELS,
    checkState,
    type Artist,
    type BookingItem,
  } from '$lib/booking';

  interface Props {
    artist: Pick<Artist, 'contract_signed' | 'not_needed'>;
    items: Pick<BookingItem, 'kind' | 'booked'>[];
    compact?: boolean;
  }
  let { artist, items, compact = false }: Props = $props();

  const states = $derived(CHECK_KEYS.map((k) => ({ key: k, state: checkState(artist, items, k) })));

  function title(label: string, state: string): string {
    return state === 'done'
      ? `${label}: gebucht`
      : state === 'na'
        ? `${label}: nicht noetig`
        : `${label}: offen`;
  }
</script>

<ul class="chips" class:compact>
  {#each states as s (s.key)}
    <li
      class="chip chip-{s.state}"
      title={title(CHECK_LABELS[s.key], s.state)}
      aria-label={title(CHECK_LABELS[s.key], s.state)}
    >
      {#if s.state === 'done'}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
      {:else if s.state === 'open'}
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.5" /></svg>
      {:else}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" /></svg>
      {/if}
      <span>{CHECK_LABELS[s.key]}</span>
    </li>
  {/each}
</ul>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.55rem 0.15rem 0.4rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    font-size: 0.72rem;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
  }
  .chip svg {
    width: 0.8rem;
    height: 0.8rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .chip-done {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
    background-color: color-mix(in srgb, var(--color-success) 12%, transparent);
  }
  .chip-open {
    color: var(--color-fg-muted);
    background-color: var(--glass-bg);
  }
  .chip-na {
    color: var(--color-fg-muted);
    opacity: 0.55;
    text-decoration: line-through;
  }
  .compact .chip span {
    display: none;
  }
  .compact .chip {
    padding: 0.2rem;
  }
</style>
