<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    /** ISO-Datum des Festivals */
    target: string;
  }

  let { target }: Props = $props();

  let now = $state(Date.now());
  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => {
      now = Date.now();
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  const remaining = $derived.by(() => {
    const diff = new Date(target).getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
      past: false,
    };
  });

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }
</script>

{#if !remaining.past}
  <div class="flex gap-3 sm:gap-6" aria-label="Countdown bis Festival">
    {#each [{ label: 'Tage', value: remaining.days }, { label: 'Std', value: remaining.hours }, { label: 'Min', value: remaining.minutes }, { label: 'Sek', value: remaining.seconds }] as cell (cell.label)}
      <div class="text-center">
        <div
          class="font-display font-black tabular-nums leading-none text-accent"
          style="font-size: clamp(2rem, 6vw, 4rem);"
        >
          {pad(cell.value)}
        </div>
        <div
          class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
        >
          {cell.label}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p
    class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
  >
    Es ist soweit!
  </p>
{/if}
