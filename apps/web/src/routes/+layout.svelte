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
  let mobileOpen = $state(false);

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

  const publicLinks = $derived([
    { href: '/lineup', label: m.nav_lineup() },
    { href: '/tickets', label: m.nav_tickets_short() },
    { href: '/background', label: 'Background' },
    { href: '/community', label: m.nav_community() },
    { href: '/faq', label: m.nav_faq() },
    { href: '/anfahrt', label: m.nav_anfahrt() },
  ]);
</script>

<nav class="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
    <a
      href="/"
      class="flex items-center gap-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
    >
      <span class="inline-block h-2 w-2 bg-accent"></span>
      {m.hero_headline()}
    </a>

    <!-- Desktop Nav -->
    <ul
      class="hidden items-center gap-5 font-mono text-xs uppercase tracking-[var(--tracking-claim)] lg:flex"
    >
      {#each publicLinks as link (link.href)}
        <li>
          <a href={link.href} class="text-fg-muted transition-colors hover:text-accent">
            {link.label}
          </a>
        </li>
      {/each}
      {#if auth.user}
        <li>
          <a href="/feedback" class="text-fg-muted transition-colors hover:text-accent">
            {m.nav_feedback()}
          </a>
        </li>
        <li>
          <a
            href="/account"
            class="border-2 border-accent bg-accent px-3 py-1 text-fg-inverse transition-all hover:bg-transparent hover:text-accent"
          >
            {m.nav_account()}
          </a>
        </li>
      {:else}
        <li>
          <a
            href="/login"
            class="border-2 border-accent bg-accent px-3 py-1 text-fg-inverse transition-all hover:bg-transparent hover:text-accent"
          >
            {m.nav_login()}
          </a>
        </li>
      {/if}
    </ul>

    <div class="flex items-center gap-3">
      <button
        onclick={toggleLang}
        class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
        aria-label="Sprache wechseln"
      >
        {m.lang_current()} / {m.lang_toggle()}
      </button>

      <!-- Mobile burger -->
      <button
        type="button"
        onclick={() => (mobileOpen = !mobileOpen)}
        aria-label="Menü öffnen"
        aria-expanded={mobileOpen}
        class="flex h-9 w-9 items-center justify-center border-2 border-border text-fg hover:border-accent hover:text-accent lg:hidden"
      >
        <span class="sr-only">Menü</span>
        {#if mobileOpen}
          <span aria-hidden="true">✕</span>
        {:else}
          <span aria-hidden="true">≡</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile Drawer -->
  {#if mobileOpen}
    <div class="border-t border-border bg-bg lg:hidden">
      <ul
        class="flex flex-col divide-y divide-border font-mono text-sm uppercase tracking-[var(--tracking-claim)]"
      >
        {#each publicLinks as link (link.href)}
          <li>
            <a
              href={link.href}
              onclick={() => (mobileOpen = false)}
              class="block px-6 py-4 text-fg-muted hover:bg-surface hover:text-accent"
            >
              {link.label}
            </a>
          </li>
        {/each}
        {#if auth.user}
          <li>
            <a
              href="/feedback"
              onclick={() => (mobileOpen = false)}
              class="block px-6 py-4 text-fg-muted hover:bg-surface hover:text-accent"
            >
              {m.nav_feedback()}
            </a>
          </li>
          <li>
            <a
              href="/account"
              onclick={() => (mobileOpen = false)}
              class="block bg-accent px-6 py-4 text-fg-inverse"
            >
              {m.nav_account()}
            </a>
          </li>
        {:else}
          <li>
            <a
              href="/login"
              onclick={() => (mobileOpen = false)}
              class="block bg-accent px-6 py-4 text-fg-inverse"
            >
              {m.nav_login()}
            </a>
          </li>
        {/if}
      </ul>
    </div>
  {/if}
</nav>

{@render children?.()}
