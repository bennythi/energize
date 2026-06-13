<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';

  const TICKETSHOP_URL = 'https://shop.tickee.de/shop/84/';

  const includes = $derived([
    m.tickets_includes_1(),
    m.tickets_includes_2(),
    m.tickets_includes_3(),
    m.tickets_includes_4(),
  ]);
</script>

<svelte:head>
  <title>{m.tickets_title()} — ENERGIZE</title>
</svelte:head>

<!-- HERO mit großem CTA -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.04]"
    style="background-image: repeating-linear-gradient(135deg, var(--color-accent) 0 2px, transparent 2px 18px);"
    aria-hidden="true"
  ></div>

  <Container>
    <div class="relative py-20 md:py-32">
      <p
        class="enter-up stagger-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        ⚡ {m.tickets_subline()}
      </p>
      <h1
        class="enter-up stagger-2 mt-6 font-display font-black uppercase leading-[0.85] tracking-[-0.02em] text-fg"
        style="font-size: clamp(3rem, 12vw, 9rem);"
      >
        Tickets <span class="text-accent">2027</span>
      </h1>
      <p class="enter-up stagger-3 mt-6 max-w-2xl text-base text-fg-muted md:text-lg">
        {m.tickets_lead()}
      </p>

      <div class="enter-up stagger-4 mt-10 flex flex-wrap gap-3">
        <a
          href="/tickets/buy"
          class="inline-flex items-center justify-center border-2 border-accent bg-accent px-8 py-4 font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg-inverse transition-all hover:bg-transparent hover:text-accent hover:shadow-[var(--shadow-glow-strong)] md:text-lg"
        >
          {m.tickets_cta_shop()}
        </a>
        <Button href="/lineup" variant="ghost">{m.tickets_cta_secondary()}</Button>
      </div>
      <p
        class="mt-4 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        ↗ {m.tickets_external_note()}
      </p>
    </div>
  </Container>
</section>

<!-- VERKAUFSPHASEN -->
<Container>
  <section class="py-20 md:py-28">
    <h2
      class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      style="font-size: clamp(2rem, 5vw, 3.5rem);"
    >
      {m.tickets_phases_title()}
    </h2>

    <article class="relative mt-10 overflow-hidden border-2 border-accent bg-surface p-6 md:p-10">
      <span
        class="absolute -top-3 left-6 bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-inverse"
      >
        ● Jetzt im Shop
      </span>

      <div class="grid gap-8 md:grid-cols-[2fr_1fr] md:items-center">
        <div>
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            Phase 01
          </p>
          <h3
            class="mt-2 font-display font-black uppercase leading-[0.9] tracking-[-0.01em] text-accent"
            style="font-size: clamp(1.75rem, 5vw, 3.25rem);"
          >
            {m.tickets_phase_loyalty_title()}
          </h3>
          <p class="mt-4 text-sm leading-relaxed text-fg-muted md:text-base">
            {m.tickets_phase_loyalty_body()}
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <a
            href="/tickets/buy"
            class="inline-flex items-center justify-center border-2 border-accent bg-accent px-6 py-4 font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg-inverse transition-all hover:bg-transparent hover:text-accent"
          >
            {m.tickets_cta_shop()}
          </a>
          <a
            href={TICKETSHOP_URL}
            target="_blank"
            rel="noopener"
            class="text-center font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
          >
            ↗ in neuem Tab
          </a>
        </div>
      </div>
    </article>
  </section>
</Container>

<!-- WAS IM TICKET STECKT -->
<section class="border-y border-border bg-surface py-20 md:py-28">
  <Container>
    <div class="grid gap-10 md:grid-cols-[1fr_2fr]">
      <h2
        class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        style="font-size: clamp(2rem, 5vw, 3rem);"
      >
        {m.tickets_includes_title()}
      </h2>
      <ul class="space-y-3">
        {#each includes as item (item)}
          <li class="flex items-baseline gap-3 border-b border-border pb-3">
            <span class="font-mono text-accent">✓</span>
            <span
              class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
            >
              {item}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </Container>
</section>

<!-- CASHLESS + SUPPORT -->
<Container>
  <section class="grid gap-6 py-20 md:grid-cols-2 md:py-28">
    <article class="border-2 border-fg p-8">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Cashless
      </p>
      <h2
        class="mt-2 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
      >
        {m.tickets_cashless_title()}
      </h2>
      <p class="mt-3 text-sm text-fg-muted md:text-base">{m.tickets_cashless_body()}</p>
    </article>

    <article class="border-2 border-fg p-8">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Support
      </p>
      <h2
        class="mt-2 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
      >
        {m.tickets_support_title()}
      </h2>
      <p class="mt-3 text-sm text-fg-muted md:text-base">{m.tickets_support_body()}</p>
    </article>
  </section>
</Container>

<!-- BOTTOM CTA -->
<section class="border-t border-border bg-accent text-fg-inverse">
  <Container>
    <div class="flex flex-col items-center gap-6 py-16 text-center md:py-20">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse/70">
        Letzte Chance vorm Festival
      </p>
      <h2
        class="font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
        style="font-size: clamp(2.5rem, 8vw, 5rem);"
      >
        Hol dir dein Ticket.
      </h2>
      <a
        href="/tickets/buy"
        class="inline-flex items-center justify-center border-2 border-fg-inverse bg-fg-inverse px-10 py-4 font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent transition-all hover:bg-transparent hover:text-fg-inverse"
      >
        {m.tickets_cta_shop()}
      </a>
    </div>
  </Container>
</section>
