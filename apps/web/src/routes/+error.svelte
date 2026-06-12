<script lang="ts">
  import { page } from '$app/state';
  import { Container, Button } from '@energize/ui';

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? 'Etwas ist schiefgelaufen.');
</script>

<svelte:head>
  <title>{status} — ENERGIZE</title>
</svelte:head>

<section class="relative overflow-hidden bg-bg">
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.05]"
    style="background-image: repeating-linear-gradient(135deg, var(--color-accent) 0 2px, transparent 2px 18px);"
    aria-hidden="true"
  ></div>

  <Container>
    <div class="relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Fehler
      </p>
      <h1
        class="mt-4 font-display font-black uppercase leading-[0.85] tracking-[-0.02em] text-accent"
        style="font-size: clamp(6rem, 25vw, 18rem);"
      >
        {status}
      </h1>
      <p
        class="mt-4 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
      >
        {#if status === 404}
          Hier ist nichts.
        {:else if status >= 500}
          Was lief schief.
        {:else}
          {message}
        {/if}
      </p>
      <p class="mt-4 max-w-md text-sm text-fg-muted">
        {#if status === 404}
          Die Seite, die du suchst, existiert nicht (mehr). Vielleicht hilft einer der Links unten.
        {:else}
          Bitte lade die Seite neu. Wenn der Fehler bleibt, melde dich bei uns.
        {/if}
      </p>

      <div class="mt-10 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="yellow">Zur Startseite</Button>
        <Button href="/lineup" variant="ghost">Lineup</Button>
        <Button href="/tickets" variant="ghost">Tickets</Button>
      </div>

      {#if status !== 404}
        <p class="mt-8 font-mono text-xs text-fg-muted opacity-60">{message}</p>
      {/if}
    </div>
  </Container>
</section>
