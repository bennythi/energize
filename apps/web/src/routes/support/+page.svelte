<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import SupportSection from '$lib/SupportSection.svelte';
</script>

<svelte:head>
  <title>Support · ENERGIZE</title>
  <meta
    name="description"
    content="Schreib der Energize Crew. Antwort kommt per Mail und im Account."
  />
</svelte:head>

<!-- HERO -->
<section class="relative overflow-hidden border-b border-border bg-bg">
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.04]"
    style="background-image: repeating-linear-gradient(135deg, var(--color-accent) 0 2px, transparent 2px 18px);"
    aria-hidden="true"
  ></div>

  <Container>
    <div class="relative py-20 md:py-28">
      <p
        class="enter-up stagger-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        ⚡ Kontakt
      </p>
      <h1
        class="enter-up stagger-2 mt-6 font-display font-black uppercase leading-[0.85] tracking-[-0.02em] text-fg"
        style="font-size: clamp(3rem, 10vw, 7rem);"
      >
        Support
      </h1>
      <p class="enter-up stagger-3 mt-6 max-w-2xl text-base text-fg-muted md:text-lg">
        Etwas ist unklar oder funktioniert nicht? Schreib uns. Wir antworten dir hier und per Mail.
        Mit Account siehst du den Status jederzeit.
      </p>
    </div>
  </Container>
</section>

<Container size="md">
  <section class="py-12 md:py-16">
    {#if !isAuthConfigured}
      <div class="border-2 border-fg-muted bg-surface p-6">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Support bald verfügbar
        </p>
        <p class="mt-2 text-sm text-fg-muted">
          Der Support-Bereich wird gerade vorbereitet. Bis dahin schreib uns direkt an
          <a href="mailto:ticketing@energize-festival.de" class="text-accent hover:underline"
            >ticketing@energize-festival.de</a
          >.
        </p>
      </div>
    {:else if auth.loading || !auth.adminChecked}
      <p class="text-fg-muted">…</p>
    {:else if !auth.user}
      <!-- Nicht eingeloggt: Hinweis + Login-CTA + Direktkontakt -->
      <div class="border-2 border-accent bg-surface p-8">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
          Login bevorzugt
        </p>
        <h2
          class="mt-3 font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-3xl"
        >
          Mit Account siehst du den Status.
        </h2>
        <p class="mt-4 text-sm text-fg-muted md:text-base">
          Wenn du eingeloggt bist, landet dein Anliegen direkt im Postfach und du siehst die Antwort
          hier und in deiner Mail. Magic-Link-Login, kein Passwort. Dauert 30 Sekunden.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <Button href="/login" variant="yellow">Mit Magic-Link einloggen</Button>
          <Button href="mailto:ticketing@energize-festival.de" variant="ghost">
            Direkt per Mail
          </Button>
        </div>
        <p class="mt-6 border-t border-border pt-4 font-mono text-xs text-fg-muted">
          Oder per Direct Message auf Instagram:
          <a
            href="https://www.instagram.com/energize_offical/"
            target="_blank"
            rel="noopener"
            class="text-accent hover:underline">@energize_offical</a
          >
        </p>
      </div>

      <!-- Quick-Hilfe -->
      <div class="mt-12">
        <h2
          class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Vielleicht steht es schon im FAQ.
        </h2>
        <p class="mt-2 text-sm text-fg-muted">
          Cashless, Anreise, Verbotenes, Garderobe und Timetable haben wir dort schon beantwortet.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Button href="/faq" variant="ghost">FAQ ansehen</Button>
          <Button href="/anfahrt" variant="ghost">Anfahrt</Button>
          <Button href="/tickets" variant="ghost">Tickets</Button>
        </div>
      </div>
    {:else}
      <!-- Eingeloggt: SupportSection wiederverwenden -->
      <SupportSection />

      <p class="mt-12 border-t border-border pt-6 font-mono text-xs text-fg-muted">
        Du kannst deine Tickets auch jederzeit über deinen
        <a href="/account" class="text-accent hover:underline">Account</a> einsehen.
      </p>
    {/if}
  </section>
</Container>
