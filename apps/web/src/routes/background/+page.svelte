<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { languageTag, type AvailableLanguageTag } from '@energize/i18n';

  const locale = $derived(languageTag() as AvailableLanguageTag);

  const copy = {
    de: {
      eyebrow: 'A real scene project',
      title: 'Wer ENERGIZE ist.',
      lead: 'Eine leidenschaftliche Organisationstruppe, die exklusive Harddance-Events in Schleswig-Holstein veranstaltet — und ein einzigartiges Festivalerlebnis liefert.',
      whoTitle: 'Wer wir sind',
      whoBody:
        'Wir sind ENERGIZE — eine leidenschaftliche Organisationstruppe, die exklusive Harddance-Events in Schleswig-Holstein veranstaltet. Wir arbeiten Stunden, Tage, Wochen — für ein paar einzigartige Erlebnisstunden mit Euch, dem Bass und den Melodien.',
      noMainstreamTitle: 'NO_MAINSTREAM_SHIT',
      noMainstreamBody:
        'Es ist ein gigantischer Unterschied, ob du auf einem Szene-Rave oder einer Mainstream-Party bist. Eine wirklich fette Stage mit hochqualitativem Sound und Timecode-Shows lösen gepaart mit der Musik wirkliche Festival-Vibes aus. ENERGIZE lebt für und von der Energie der Community.',
      standardsTitle: 'Unsere Standards',
      standards: [
        'Maximal 80 % Auslastung — genug Platz zum Tanzen',
        'Techno, Psytrance & Harder Styles',
        'Welcoming, community-focused Atmosphäre',
        'Effiziente Abläufe an Einlass, Bar und Garderobe',
        'High-Quality-Sound, Stage-Design & Visual-Shows',
      ],
      ctaTitle: 'Wir sehen uns 2027.',
      ctaBody: '29. Mai 2027 · Stockelsdorf / Dissau',
      ctaTickets: 'Tickets sichern',
      ctaLineup: 'Lineup ansehen',
    },
    en: {
      eyebrow: 'A real scene project',
      title: 'Who ENERGIZE is.',
      lead: 'A passionate organising crew, hosting exclusive hard-dance events in Schleswig-Holstein — built around delivering a unique festival experience.',
      whoTitle: 'Who we are',
      whoBody:
        'We are ENERGIZE — a passionate crew hosting exclusive hard-dance events in Schleswig-Holstein. We work hours, days, weeks for a few unique hours with you, the bass and the melodies.',
      noMainstreamTitle: 'NO_MAINSTREAM_SHIT',
      noMainstreamBody:
        'There is a giant difference between being at a scene rave versus a mainstream party. A truly heavy stage with high-quality sound and timecode shows, paired with the music, triggers real festival vibes. ENERGIZE lives for and from the energy of the community.',
      standardsTitle: 'Our standards',
      standards: [
        'Max 80 % capacity — enough space to dance',
        'Techno, Psytrance & Harder Styles',
        'Welcoming, community-focused atmosphere',
        'Smooth entry, bar and coat-check flow',
        'High-quality sound, stage design & visual shows',
      ],
      ctaTitle: 'See you in 2027.',
      ctaBody: '29 May 2027 · Stockelsdorf / Dissau',
      ctaTickets: 'Get tickets',
      ctaLineup: 'View line-up',
    },
  } as const;

  const t = $derived(copy[locale]);
</script>

<svelte:head>
  <title>{t.title} — ENERGIZE</title>
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
        ⚡ {t.eyebrow}
      </p>
      <h1
        class="enter-up stagger-2 mt-6 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 8vw, 6rem);"
      >
        {t.title}
      </h1>
      <p class="enter-up stagger-3 mt-6 max-w-2xl text-base text-fg-muted md:text-lg">
        {t.lead}
      </p>
    </div>
  </Container>
</section>

<!-- WER WIR SIND -->
<Container>
  <section class="grid gap-10 py-20 md:grid-cols-[1fr_2fr] md:py-28">
    <h2
      class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      style="font-size: clamp(1.5rem, 3vw, 2.5rem);"
    >
      {t.whoTitle}
    </h2>
    <p class="text-base leading-relaxed text-fg-muted md:text-lg">{t.whoBody}</p>
  </section>
</Container>

<!-- NO MAINSTREAM SHIT — Plakat-Style -->
<section class="bg-accent text-fg-inverse">
  <Container>
    <div class="py-20 md:py-28">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse/60">
        02 / Manifest
      </p>
      <h2
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
        style="font-size: clamp(2.5rem, 9vw, 7rem);"
      >
        {t.noMainstreamTitle}
      </h2>
      <p class="mt-6 max-w-3xl text-base font-medium leading-relaxed md:text-lg">
        {t.noMainstreamBody}
      </p>
    </div>
  </Container>
</section>

<!-- STANDARDS -->
<Container>
  <section class="py-20 md:py-28">
    <h2
      class="font-display font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      style="font-size: clamp(2rem, 5vw, 3.5rem);"
    >
      {t.standardsTitle}
    </h2>
    <ul class="mt-10 divide-y divide-border border-y-2 border-border">
      {#each t.standards as standard, i (i)}
        <li class="flex items-baseline gap-4 py-5">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span
            class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-xl"
          >
            {standard}
          </span>
        </li>
      {/each}
    </ul>
  </section>
</Container>

<!-- CTA -->
<section class="border-t border-border bg-surface py-20 md:py-28">
  <Container>
    <div class="text-center">
      <h2
        class="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2.5rem, 8vw, 5rem);"
      >
        {t.ctaTitle}
      </h2>
      <p
        class="mt-4 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted md:text-sm"
      >
        {t.ctaBody}
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <Button href="/tickets" variant="yellow">{t.ctaTickets}</Button>
        <Button href="/lineup" variant="ghost">{t.ctaLineup}</Button>
      </div>
    </div>
  </Container>
</section>
