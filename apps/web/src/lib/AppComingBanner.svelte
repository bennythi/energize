<script lang="ts">
  import { m } from '@energize/i18n';
  import { auth } from '$lib/auth.svelte';

  interface Props {
    variant?: 'default' | 'compact';
  }

  let { variant = 'default' }: Props = $props();
</script>

{#if variant === 'compact'}
  <div class="border-2 border-accent bg-surface p-5 md:p-6">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      ⚡ {m.app_coming_eyebrow()}
    </p>
    <p
      class="mt-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg md:text-2xl"
    >
      {m.app_coming_title()}
    </p>
    <p class="mt-2 text-sm text-fg-muted">{m.app_coming_body()}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <span
        class="border-2 border-fg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {m.app_coming_ios()}
      </span>
      <span
        class="border-2 border-fg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {m.app_coming_android()}
      </span>
      <span
        class="border-2 border-fg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        Coming Soon
      </span>
    </div>
  </div>
{:else}
  <section class="border-y border-border bg-accent text-fg-inverse">
    <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-inverse/70">
        ⚡ {m.app_coming_eyebrow()}
      </p>
      <h2
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
        style="font-size: clamp(2rem, 6vw, 4.5rem);"
      >
        {m.app_coming_title()}
      </h2>
      <p class="mt-4 max-w-2xl text-base font-medium leading-relaxed md:text-lg">
        {m.app_coming_body()}
      </p>

      <div class="mt-8 flex flex-wrap gap-3">
        <span
          class="inline-flex items-center gap-2 border-2 border-fg-inverse bg-fg-inverse px-5 py-3 font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          <span>iOS</span>
          <span class="text-xs opacity-70">soon</span>
        </span>
        <span
          class="inline-flex items-center gap-2 border-2 border-fg-inverse bg-fg-inverse px-5 py-3 font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          <span>Android</span>
          <span class="text-xs opacity-70">soon</span>
        </span>
      </div>

      {#if !auth.user}
        <p class="mt-6 max-w-xl border-l-4 border-fg-inverse pl-4 text-sm md:text-base">
          <a href="/login" class="underline underline-offset-4 hover:opacity-80">
            → {m.app_coming_notify()}
          </a>
        </p>
      {:else}
        <p class="mt-6 max-w-xl border-l-4 border-fg-inverse pl-4 text-sm md:text-base">
          ✓ {m.app_coming_notify()}
        </p>
      {/if}
    </div>
  </section>
{/if}
