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
      class="absolute left-1/2 top-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style="background: radial-gradient(closest-side, var(--color-accent-glow), transparent);"
    ></div>
  </div>

  <div class="relative z-10 flex flex-col items-center gap-6">
    {#if eyebrow}
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        {eyebrow}
      </p>
    {/if}

    {#if headline}
      <h1
        class="font-display font-black uppercase leading-[0.95] tracking-[-0.02em] text-fg"
        style="font-size: var(--text-hero);"
      >
        {headline}
      </h1>
    {/if}

    {#if subline}
      <p class="max-w-2xl font-display text-xl uppercase tracking-[var(--tracking-wide)] text-fg">
        {subline}
      </p>
    {/if}

    {#if claim}
      <p class="font-mono text-sm uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        #{claim}
      </p>
    {/if}

    {#if actions}
      <div class="mt-6 flex flex-wrap items-center justify-center gap-4">
        {@render actions()}
      </div>
    {/if}
  </div>
</section>
