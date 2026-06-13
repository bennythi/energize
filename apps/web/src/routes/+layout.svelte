<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import '../app.css';
  import { m, languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import { auth } from '$lib/auth.svelte';
  import { favorites } from '$lib/favorites.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const LANG_STORAGE_KEY = 'energize.lang';

  // languageTag() ist hier schon korrekt, weil +layout.ts beim Client-
  // Init aus localStorage gelesen und setLanguageTag() aufgerufen hat.
  let currentLang = $state<AvailableLanguageTag>(languageTag() as AvailableLanguageTag);
  let mobileOpen = $state(false);
  let scrolled = $state(false);
  let burgerButton = $state<HTMLButtonElement | null>(null);

  const currentPath = $derived(page.url.pathname.replace(/\/$/, '') || '/');

  function isActive(href: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  // Sticky-Nav: ab 24px scroll wechselt der Background zu opak +
  // staerkerer Border. Subtle, aber bringt visuell separation.
  $effect(() => {
    if (!browser) return;
    function onScroll() {
      scrolled = window.scrollY > 24;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  // auth.init() läuft schon in +layout.ts (Module-Init, vor jedem Render)
  // — hier nur favorites an Auth-Status koppeln.
  $effect(() => {
    const userId = auth.user?.id;
    if (userId) {
      void favorites.load();
    } else if (auth.initialized) {
      favorites.clear();
    }
  });

  // Drawer-A11y: Escape schliesst, scroll-lock auf body, Focus zurueck
  // auf den Burger nach Schliessen.
  $effect(() => {
    if (!browser) return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      function onKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          mobileOpen = false;
        }
      }
      window.addEventListener('keydown', onKeydown);
      return () => {
        window.removeEventListener('keydown', onKeydown);
        document.body.style.overflow = '';
        // Focus zurueck auf Burger, nachdem der Drawer zu ist
        queueMicrotask(() => burgerButton?.focus());
      };
    }
  });

  function closeMobile() {
    mobileOpen = false;
  }

  function toggleLang() {
    if (!browser) return;
    const next: AvailableLanguageTag = currentLang === 'de' ? 'en' : 'de';
    localStorage.setItem(LANG_STORAGE_KEY, next);
    // Reload reicht — +layout.ts liest beim naechsten Start localStorage
    // und ruft setLanguageTag() VOR jedem m.xxx()-Aufruf auf.
    location.reload();
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

<nav class="nav-bar sticky top-0 z-30 border-b" class:nav-scrolled={scrolled}>
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
          <a
            href={link.href}
            class="nav-link"
            class:nav-link-active={isActive(link.href)}
            aria-current={isActive(link.href) ? 'page' : undefined}
          >
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
        aria-label={m.nav_lang_switch()}
      >
        {m.lang_current()} / {m.lang_toggle()}
      </button>

      <!-- Mobile burger -->
      <button
        bind:this={burgerButton}
        type="button"
        onclick={() => (mobileOpen = !mobileOpen)}
        aria-label={mobileOpen ? m.nav_menu_close() : m.nav_menu_open()}
        aria-expanded={mobileOpen}
        aria-controls="mobile-drawer"
        class="flex h-11 w-11 items-center justify-center border-2 border-border text-fg transition-all hover:border-accent hover:text-accent active:scale-95 lg:hidden"
      >
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
    <div
      id="mobile-drawer"
      class="drawer border-t border-border bg-bg lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={m.nav_community()}
    >
      <ul
        class="flex flex-col divide-y divide-border font-mono text-sm uppercase tracking-[var(--tracking-claim)]"
      >
        {#each publicLinks as link (link.href)}
          <li>
            <a
              href={link.href}
              onclick={closeMobile}
              class="drawer-link block px-6 py-4 text-fg-muted hover:bg-surface hover:text-accent"
            >
              {link.label}
            </a>
          </li>
        {/each}
        {#if auth.user}
          <li>
            <a
              href="/feedback"
              onclick={closeMobile}
              class="drawer-link block px-6 py-4 text-fg-muted hover:bg-surface hover:text-accent"
            >
              {m.nav_feedback()}
            </a>
          </li>
          <li>
            <a
              href="/account"
              onclick={closeMobile}
              class="drawer-link block bg-accent px-6 py-4 text-fg-inverse"
            >
              {m.nav_account()}
            </a>
          </li>
        {:else}
          <li>
            <a
              href="/login"
              onclick={closeMobile}
              class="drawer-link block bg-accent px-6 py-4 text-fg-inverse"
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

<style>
  /* Nav-Background-Progression: am Top transparent + thin border,
   * nach 24px scroll opaker + glow-Border. Cheap visual separation. */
  .nav-bar {
    background-color: rgba(10, 10, 10, 0.6);
    border-color: transparent;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition:
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      backdrop-filter var(--dur-hover) var(--ease-out);
  }
  .nav-scrolled {
    background-color: rgba(10, 10, 10, 0.92);
    border-color: var(--color-border);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  /* Nav-Link: active-Underline via after-pseudo (anti-aliased
   * smoother als border-bottom-Toggle). */
  .nav-link {
    position: relative;
    color: var(--color-fg-muted);
    padding-bottom: 4px;
    transition: color var(--dur-hover) var(--ease-out);
  }
  .nav-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    width: 100%;
    background-color: var(--color-accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--dur-enter) var(--ease-out);
  }
  @media (hover: hover) and (pointer: fine) {
    .nav-link:hover {
      color: var(--color-accent);
    }
    .nav-link:hover::after {
      transform: scaleX(0.5);
      transform-origin: left;
    }
  }
  .nav-link-active {
    color: var(--color-fg);
  }
  .nav-link-active::after {
    transform: scaleX(1);
  }

  /* Emil-Pattern: enter mit ease-out, short duration, stagger.
   * scale(0.97) statt scale(0) — "nothing in the real world appears from nothing".
   * prefers-reduced-motion entfernt die Translate-Komponente. */
  .drawer {
    animation: drawer-in 180ms cubic-bezier(0.23, 1, 0.32, 1);
    transform-origin: top center;
  }
  @keyframes drawer-in {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .drawer-link {
    opacity: 0;
    animation: drawer-link-in 220ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }
  .drawer-link:nth-child(1) {
    animation-delay: 40ms;
  }
  .drawer-link:nth-child(2) {
    animation-delay: 70ms;
  }
  .drawer-link:nth-child(3) {
    animation-delay: 100ms;
  }
  .drawer-link:nth-child(4) {
    animation-delay: 130ms;
  }
  .drawer-link:nth-child(5) {
    animation-delay: 160ms;
  }
  .drawer-link:nth-child(6) {
    animation-delay: 190ms;
  }
  .drawer-link:nth-child(7) {
    animation-delay: 220ms;
  }
  .drawer-link:nth-child(8) {
    animation-delay: 250ms;
  }
  @keyframes drawer-link-in {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .drawer-link {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
</style>
