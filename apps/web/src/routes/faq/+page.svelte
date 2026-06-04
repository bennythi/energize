<script lang="ts">
  import { Container, Heading } from '@energize/ui';
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

  const groups = $derived(
    Object.entries(
      data.faq.reduce<Record<string, typeof data.faq>>((acc, entry) => {
        (acc[entry.category] ??= []).push(entry);
        return acc;
      }, {}),
    ),
  );
</script>

<svelte:head>
  <title>FAQ — ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-16 md:py-24">
    <Heading level={1} display>FAQ</Heading>

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
                  class="cursor-pointer list-none font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                >
                  {pickLocale(entry.question, locale)}
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
  </section>
</Container>
