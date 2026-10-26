<script lang="ts" generics="T extends string">
  // Segment-Auswahl (Radio-Gruppe) im Glas-Stil.
  interface Props {
    options: { value: T; label: string }[];
    value: T;
    label: string;
    full?: boolean;
  }
  let { options, value = $bindable(), label, full = false }: Props = $props();
</script>

<div class="seg" class:full role="radiogroup" aria-label={label}>
  {#each options as opt (opt.value)}
    <button
      type="button"
      role="radio"
      aria-checked={value === opt.value}
      class:on={value === opt.value}
      onclick={() => (value = opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    gap: 0.15rem;
    padding: 0.2rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .seg.full {
    display: flex;
    width: 100%;
  }
  .seg.full button {
    flex: 1;
  }
  .seg button {
    padding: 0.5rem 0.95rem;
    border-radius: var(--radius-pill);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .seg button:not(.on):hover {
    color: var(--color-fg);
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
</style>
