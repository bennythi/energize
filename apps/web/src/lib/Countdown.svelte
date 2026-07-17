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

  const cells = $derived([
    { label: 'Tage', value: remaining.days, key: 'd' },
    { label: 'Std', value: remaining.hours, key: 'h' },
    { label: 'Min', value: remaining.minutes, key: 'm' },
    { label: 'Sek', value: remaining.seconds, key: 's' },
  ]);
</script>

{#if !remaining.past}
  <div class="countdown flex gap-3 sm:gap-6" aria-label="Countdown bis Festival">
    {#each cells as cell (cell.key)}
      <div class="text-center">
        <!-- Key-Block macht ein Element-Swap pro Wert-Aenderung,
             damit die digit-up Animation triggert. Emil: animate
             state-changes for spatial consistency. -->
        <div
          class="digit font-display font-black tabular-nums leading-none text-accent"
          style="font-size: clamp(2rem, 6vw, 4rem);"
        >
          {#key cell.value}
            <span class="digit-frame">{pad(cell.value)}</span>
          {/key}
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

<style>
  .digit {
    position: relative;
    overflow: hidden;
    height: 1em;
  }
  .digit-frame {
    display: inline-block;
    animation: digit-up 280ms var(--ease-out);
  }
  @keyframes digit-up {
    from {
      transform: translateY(60%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .digit-frame {
      animation: none;
    }
  }
</style>
