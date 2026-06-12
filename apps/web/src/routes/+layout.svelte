<script lang="ts">
  import '../app.css';
  import { m, setLanguageTag, languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import { auth } from '$lib/auth.svelte';
  import { favorites } from '$lib/favorites.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let currentLang = $state<AvailableLanguageTag>(languageTag() as AvailableLanguageTag);

  $effect(() => {
    auth.init();
  });

  $effect(() => {
    const userId = auth.user?.id;
    if (userId) {
      void favorites.load();
    } else if (auth.initialized) {
      favorites.clear();
    }
  });

  function toggleLang() {
    const next: AvailableLanguageTag = currentLang === 'de' ? 'en' : 'de';
    setLanguageTag(next);
    currentLang = next;
  }
</script>

<nav
  class="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-6 py-3 backdrop-blur"
>
  <a
    href="/"
    class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
  >
    {m.hero_headline()}
  </a>

  <ul
    class="hidden items-center gap-6 font-mono text-xs uppercase tracking-[var(--tracking-claim)] md:flex"
  >
    <li>
      <a href="/lineup" class="text-fg-muted hover:text-accent transition-colors"
        >{m.nav_lineup()}</a
      >
    </li>
    <li>
      <a href="/faq" class="text-fg-muted hover:text-accent transition-colors">{m.nav_faq()}</a>
    </li>
    <li>
      <a href="/anfahrt" class="text-fg-muted hover:text-accent transition-colors"
        >{m.nav_anfahrt()}</a
      >
    </li>
    {#if auth.user}
      <li>
        <a href="/feedback" class="text-fg-muted hover:text-accent transition-colors"
          >{m.nav_feedback()}</a
        >
      </li>
      <li>
        <a href="/account" class="text-fg-muted hover:text-accent transition-colors"
          >{m.nav_account()}</a
        >
      </li>
    {:else}
      <li>
        <a href="/login" class="text-fg-muted hover:text-accent transition-colors"
          >{m.nav_login()}</a
        >
      </li>
    {/if}
  </ul>

  <button
    onclick={toggleLang}
    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted hover:text-accent transition-colors"
    aria-label="Sprache wechseln"
  >
    {m.lang_current()} → {m.lang_toggle()}
  </button>
</nav>

{@render children?.()}
