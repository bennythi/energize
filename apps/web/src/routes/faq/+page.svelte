<script lang="ts">
  import { Container, Button } from '@energize/ui';
  import { pickLocale, type FaqCategory } from '@energize/sanity-client';
  import { languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const locale = $derived(languageTag() as AvailableLanguageTag);

  const categoryLabels: Record<FaqCategory, string> = {
    tickets: 'Tickets',
    anreise: 'Anreise',
    hausordnung: 'Hausordnung',
    cashless: 'Cashless',
    awareness: 'Awareness',
    general: 'Allgemein',
  };

  // Stabile Reihenfolge: Allgemein zuerst, dann Tickets, Cashless, etc.
  const categoryOrder: FaqCategory[] = [
    'general',
    'tickets',
    'anreise',
    'cashless',
    'hausordnung',
    'awareness',
  ];

  const groups = $derived.by(() => {
    const buckets = data.faq.reduce<Record<string, typeof data.faq>>((acc, entry) => {
      (acc[entry.category] ??= []).push(entry);
      return acc;
    }, {});
    return categoryOrder
      .filter((cat) => buckets[cat]?.length)
      .map((cat) => [cat, buckets[cat]] as const);
  });
</script>

<svelte:head>
  <title>FAQ · ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-16 md:py-24">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ Häufige Fragen
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2.5rem, 8vw, 6rem);"
    >
      FAQ
    </h1>

    {#if data.faq.length === 0}
      <p class="mt-8 text-fg-muted">FAQ wird befüllt.</p>
    {/if}

    {#each groups as [category, entries] (category)}
      <section class="mt-12">
        <h2
          class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {categoryLabels[category as FaqCategory] ?? category}
        </h2>
        <ul class="mt-4 divide-y divide-border border-y border-border">
          {#each entries as entry (entry._id)}
            <li>
              <details class="group p-4 transition-colors hover:bg-surface">
                <summary
                  class="flex cursor-pointer list-none items-baseline justify-between gap-4 font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                >
                  <span class="flex-1">{pickLocale(entry.question, locale)}</span>
                  <span
                    aria-hidden="true"
                    class="shrink-0 font-mono text-2xl text-accent transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
                  {pickLocale(entry.answer, locale)}
                </p>
              </details>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    <!-- Support-CTA -->
    <section class="mt-16 border-2 border-accent bg-surface p-6 md:p-8">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        Frage nicht dabei?
      </p>
      <h2
        class="mt-3 font-display font-black uppercase leading-[0.95] tracking-[-0.01em] text-fg"
        style="font-size: clamp(1.5rem, 4vw, 2.25rem);"
      >
        Schreib uns direkt.
      </h2>
      <p class="mt-3 max-w-xl text-sm text-fg-muted">
        Über den Support-Bereich landet dein Anliegen direkt im Energize-Postfach. Antwort kommt per
        Mail und ist jederzeit im Account einsehbar.
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <Button href="/support" variant="yellow">Zum Support →</Button>
        <Button href="https://www.instagram.com/energize_offical/" variant="ghost">
          Instagram-DM
        </Button>
      </div>
    </section>
  </section>
</Container>
