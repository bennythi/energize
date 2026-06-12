<script lang="ts">
  import { Container } from '@energize/ui';
  import { m } from '@energize/i18n';

  const TICKETSHOP_URL = 'https://shop.tickee.de/shop/84/';

  let loaded = $state(false);
  let iframeEl = $state<HTMLIFrameElement | null>(null);

  function handleLoad() {
    loaded = true;
  }
</script>

<svelte:head>
  <title>{m.tickets_iframe_title()} — ENERGIZE</title>
</svelte:head>

<!-- Slim Header-Strip mit Brand + Open-in-new-Tab -->
<div class="border-b border-border bg-surface">
  <Container>
    <div class="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent">
          ⚡ {m.tickets_iframe_title()}
        </p>
        <p class="mt-1 text-xs text-fg-muted md:text-sm">{m.tickets_iframe_hint()}</p>
      </div>
      <a
        href={TICKETSHOP_URL}
        target="_blank"
        rel="noopener"
        class="inline-flex items-center justify-center self-start border-2 border-border bg-bg px-3 py-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-accent hover:text-accent"
      >
        {m.tickets_iframe_open_external()}
      </a>
    </div>
  </Container>
</div>

<!-- iframe in voller verfügbarer Höhe -->
<div class="relative bg-bg" style="min-height: calc(100vh - 200px);">
  {#if !loaded}
    <!-- Loading-Skeleton -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface"
      aria-hidden="true"
    >
      <div class="flex gap-2">
        {#each Array(3) as _, i (i)}
          <span class="h-3 w-3 animate-pulse bg-accent" style={`animation-delay: ${i * 150}ms;`}
          ></span>
        {/each}
      </div>
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        {m.tickets_iframe_loading()}
      </p>
    </div>
  {/if}

  <iframe
    bind:this={iframeEl}
    src={TICKETSHOP_URL}
    title={m.tickets_iframe_title()}
    onload={handleLoad}
    referrerpolicy="no-referrer-when-downgrade"
    sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
    class="block w-full border-0 bg-bg"
    style="height: calc(100vh - 200px); min-height: 800px;"
  ></iframe>
</div>

<!-- Fallback unten -->
<div class="border-t border-border bg-surface">
  <Container>
    <div class="py-4 text-center">
      <a
        href={TICKETSHOP_URL}
        target="_blank"
        rel="noopener"
        class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
      >
        {m.tickets_iframe_fallback()}
      </a>
    </div>
  </Container>
</div>
