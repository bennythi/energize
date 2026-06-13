<script lang="ts">
  interface Props {
    eyebrow?: string;
    headline?: string;
    subline?: string;
    claim?: string;
    actions?: import('svelte').Snippet;
  }

  let { eyebrow, headline, subline, claim, actions }: Props = $props();
</script>

<section
  class="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center"
>
  <div class="pointer-events-none absolute inset-0 opacity-30">
    <div
      class="hero-glow absolute left-1/2 top-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style="background: radial-gradient(closest-side, var(--color-accent-glow), transparent);"
    ></div>
  </div>

  <div class="relative z-10 flex flex-col items-center gap-6">
    {#if eyebrow}
      <p
        class="enter-up stagger-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {eyebrow}
      </p>
    {/if}

    {#if headline}
      <h1
        class="enter-up stagger-2 font-display font-black uppercase leading-[0.95] tracking-[-0.02em] text-fg"
        style="font-size: var(--text-hero);"
      >
        {headline}
      </h1>
    {/if}

    {#if subline}
      <p
        class="enter-up stagger-3 max-w-2xl font-display text-xl uppercase tracking-[var(--tracking-wide)] text-fg"
      >
        {subline}
      </p>
    {/if}

    {#if claim}
      <p
        class="enter-up stagger-4 font-mono text-sm uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        #{claim}
      </p>
    {/if}

    {#if actions}
      <div class="enter-up stagger-5 mt-6 flex flex-wrap items-center justify-center gap-4">
        {@render actions()}
      </div>
    {/if}
  </div>

  <!-- Scroll-Indicator -->
  <div
    class="enter-fade stagger-6 absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
    aria-hidden="true"
  >
    <span class="scroll-arrow">↓</span>
  </div>
</section>

<style>
  /* Hero-Glow pulsiert ganz subtil (Emil: "alive feeling") */
  @media (prefers-reduced-motion: no-preference) {
    .hero-glow {
      animation: glow-pulse 6s ease-in-out infinite;
    }
    .scroll-arrow {
      display: inline-block;
      animation: bounce 2s ease-in-out infinite;
    }
  }
  @keyframes glow-pulse {
    0%,
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(1.08);
    }
  }
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    50% {
      transform: translateY(4px);
      opacity: 1;
    }
  }
</style>
