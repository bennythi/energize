<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import AppComingBanner from '$lib/AppComingBanner.svelte';
</script>

<svelte:head>
  <title>{m.community_title()} — ENERGIZE</title>
</svelte:head>

<!-- HERO -->
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
        ⚡ {m.community_eyebrow()}
      </p>
      <h1
        class="enter-up stagger-2 mt-6 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 8vw, 6rem);"
      >
        {m.community_title()}
      </h1>
      <p class="enter-up stagger-3 mt-6 max-w-2xl text-base text-fg-muted md:text-lg">
        {m.community_lead()}
      </p>
      <div class="enter-up stagger-4 mt-8 flex flex-wrap gap-3">
        <Button href="/login" variant="yellow">{m.community_cta()}</Button>
      </div>
    </div>
  </Container>
</section>

<!-- WAS DU BEKOMMST -->
<Container>
  <section class="py-20 md:py-28">
    <h2
      class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      style="font-size: clamp(2rem, 5vw, 3.5rem);"
    >
      {m.community_what_title()}
    </h2>

    <div class="mt-10 grid gap-4 md:grid-cols-2">
      {#each [{ n: '01', t: m.community_what_1_title(), b: m.community_what_1_body() }, { n: '02', t: m.community_what_2_title(), b: m.community_what_2_body() }, { n: '03', t: m.community_what_3_title(), b: m.community_what_3_body() }, { n: '04', t: m.community_what_4_title(), b: m.community_what_4_body() }] as item (item.n)}
        <article class="border-2 border-fg p-6">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            {item.n}
          </p>
          <h3
            class="mt-3 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-2xl"
          >
            {item.t}
          </h3>
          <p class="mt-2 text-sm text-fg-muted md:text-base">{item.b}</p>
        </article>
      {/each}
    </div>
  </section>
</Container>

<!-- LOGIN ERKLÄRT -->
<section class="border-y border-border bg-surface py-20 md:py-28">
  <Container>
    <h2
      class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      style="font-size: clamp(2rem, 5vw, 3.5rem);"
    >
      {m.community_login_title()}
    </h2>
    <p class="mt-4 max-w-2xl text-base text-fg-muted md:text-lg">
      {m.community_login_lead()}
    </p>

    <ol class="mt-12 grid gap-6 md:grid-cols-2">
      {#each [{ n: '01', t: m.community_login_step_1_title(), b: m.community_login_step_1_body(), warn: false }, { n: '02', t: m.community_login_step_2_title(), b: m.community_login_step_2_body(), warn: false }, { n: '03', t: m.community_login_step_3_title(), b: m.community_login_step_3_body(), warn: true }, { n: '04', t: m.community_login_step_4_title(), b: m.community_login_step_4_body(), warn: false }] as step (step.n)}
        <li
          class="relative border-2 bg-bg p-6 transition-colors"
          class:border-accent={step.warn}
          class:border-border={!step.warn}
        >
          <span
            class="absolute -top-3 left-6 bg-surface px-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
          >
            Step {step.n}
          </span>
          <h3
            class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
          >
            {step.t}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-fg-muted md:text-base">{step.b}</p>
          {#if step.warn}
            <p
              class="mt-3 inline-block bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-inverse"
            >
              ⚠ wichtig
            </p>
          {/if}
        </li>
      {/each}
    </ol>

    <div class="mt-12 border-l-4 border-success bg-bg p-6">
      <h3
        class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-success"
      >
        {m.community_login_safety_title()}
      </h3>
      <p class="mt-2 text-sm leading-relaxed text-fg-muted">
        {m.community_login_safety_body()}
      </p>
    </div>
  </Container>
</section>

<!-- CTA -->
<Container>
  <section class="py-20 md:py-28 text-center">
    <h2
      class="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2.5rem, 7vw, 5rem);"
    >
      Bist du dabei?
    </h2>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <Button href="/login" variant="yellow">{m.community_cta()}</Button>
    </div>
  </section>
</Container>

<!-- APP COMING -->
<AppComingBanner />
