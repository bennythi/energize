<script lang="ts">
  import { Container, Heading } from '@energize/ui';
</script>

<svelte:head>
  <title>Impressum — ENERGIZE</title>
</svelte:head>

<Container size="md">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Impressum</Heading>

    <div class="mt-8 space-y-6 text-sm leading-relaxed text-fg-muted">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Platzhalter — finaler Text von Brainchildz
      </p>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Angaben gemäß § 5 TMG
        </h2>
        <p class="mt-2">
          Brainchildz Event Agentur<br />
          [Anschrift Brainchildz]<br />
          [PLZ Ort]
        </p>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Kontakt
        </h2>
        <p class="mt-2">E-Mail: [kontakt@brainchildz.de]</p>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Vertretungsberechtigt
        </h2>
        <p class="mt-2">[Geschäftsführer-Name]</p>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Handelsregister
        </h2>
        <p class="mt-2">[HRB-Nummer, Amtsgericht]</p>
      </div>

      <div>
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          USt-IdNr.
        </h2>
        <p class="mt-2">[USt-IdNr.]</p>
      </div>
    </div>
  </section>
</Container>
