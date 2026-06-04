<script lang="ts">
  import { Container, Heading } from '@energize/ui';
</script>

<svelte:head>
  <title>Datenschutz — ENERGIZE</title>
</svelte:head>

<Container size="md">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Datenschutz</Heading>

    <div class="mt-8 space-y-6 text-sm leading-relaxed text-fg-muted">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Platzhalter — finaler Text von Brainchildz / Datenschutzbeauftragten
      </p>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          1. Verantwortlicher
        </h2>
        <p class="mt-2">Brainchildz Event Agentur, [Anschrift], [E-Mail]</p>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          2. Erhobene Daten
        </h2>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Kontaktformular: Name, E-Mail, Nachricht.</li>
          <li>Account-Bereich (App): E-Mail-Adresse + ggf. Push-Token.</li>
          <li>
            Tickee-Ticket-Shop: betreibt tickee GmbH eigenverantwortlich (siehe deren
            Datenschutzerklärung).
          </li>
          <li>
            Plausible Analytics (sofern aktiv): anonymisierte Besucherstatistik, keine Cookies.
          </li>
        </ul>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          3. Rechtsgrundlagen, Speicherdauer, Rechte
        </h2>
        <p class="mt-2">[Standard-DSGVO-Textbausteine vom Datenschutzbeauftragten].</p>
      </div>
    </div>
  </section>
</Container>
