<script lang="ts">
  import { Container, Heading } from '@energize/ui';
</script>

<svelte:head>
  <title>Impressum · ENERGIZE</title>
</svelte:head>

<Container size="md">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Impressum</Heading>

    <p class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      Stand: 13.06.2026 · Demo-Version, Details werden vor Live-Gang ergänzt
    </p>

    <div class="mt-8 space-y-10 text-sm leading-relaxed text-fg-muted md:text-base">
      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Angaben gemäß § 5 TMG
        </h2>
        <p class="mt-3">
          Brainchildz Event Agentur<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Kontakt
        </h2>
        <p class="mt-3">
          E-Mail:
          <a href="mailto:benjamin.thiel@outlook.com" class="text-accent hover:underline"
            >benjamin.thiel@outlook.com</a
          ><br />
          Telefon: [folgt]
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Vertretungsberechtigt
        </h2>
        <p class="mt-3">Benjamin Thiel<br />[ggf. weitere Geschäftsführer]</p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Handelsregister
        </h2>
        <p class="mt-3">
          Registergericht: [Amtsgericht]<br />
          Registernummer: HRB [folgt]
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          USt-IdNr.
        </h2>
        <p class="mt-3">Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [DE-Nummer folgt]</p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p class="mt-3">Benjamin Thiel, Anschrift wie oben.</p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Streitschlichtung
        </h2>
        <p class="mt-3">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener"
            class="text-accent hover:underline">ec.europa.eu/consumers/odr</a
          >. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Haftung für Inhalte
        </h2>
        <p class="mt-3">
          Inhalte dieser Webseite werden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als
          Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Haftung für Links
        </h2>
        <p class="mt-3">
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Für diese fremden Inhalte können wir keine Gewähr übernehmen. Bei
          Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Urheberrecht
        </h2>
        <p class="mt-3">
          Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
          Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers.
        </p>
      </section>

      <section>
        <h2
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          Bildnachweise
        </h2>
        <p class="mt-3">
          Brand-Assets (Logo, Schriftzug, Plakat-Style): Brainchildz Event Agentur.<br />
          Artist-Plakate auf /lineup: Brainchildz Event Agentur.<br />
          User-Uploads auf /wall: jeweilige Urheber, Lizenz an Brainchildz für Marketing.
        </p>
      </section>
    </div>
  </section>
</Container>
