<script lang="ts">
  // Modales Panel: auf Mobile als Bottom-Sheet, ab md zentriert.
  interface Props {
    title: string;
    eyebrow?: string;
    onclose: () => void;
    children?: import('svelte').Snippet;
  }
  let { title, eyebrow, onclose, children }: Props = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="backdrop" role="presentation" onclick={onclose}></div>
<div class="wrap" role="dialog" aria-modal="true" aria-label={title}>
  <div class="glass-strong panel p-6">
    {#if eyebrow}
      <p class="text-xs font-medium uppercase tracking-wider text-accent">{eyebrow}</p>
    {/if}
    <h2 class="mt-1 text-xl font-semibold tracking-tight text-fg">{title}</h2>
    <div class="mt-5">{@render children?.()}</div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background-color: rgba(0, 0, 0, 0.55);
    animation: fade var(--dur-enter) var(--ease-out);
  }
  .wrap {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 51;
    display: flex;
    justify-content: center;
    padding: 1rem;
    pointer-events: none;
  }
  .panel {
    pointer-events: auto;
    width: 100%;
    max-width: 28rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    border-radius: var(--radius-xl);
    animation: up var(--dur-enter) var(--ease-drawer);
  }
  @media (min-width: 768px) {
    .wrap {
      inset: 0;
      align-items: center;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes up {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .backdrop,
    .panel {
      animation: none;
    }
  }
</style>
