<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import '../app.css';
  import { languageTag, type AvailableLanguageTag } from '@platform/i18n';
  import { auth } from '$lib/auth.svelte';
  import { favorites } from '$lib/favorites.svelte';
  import { initAnalytics } from '$lib/analytics.svelte';
  import { isModuleEnabled } from '$lib/modules';
  import { instance } from '$instance/instance.config';

  interface Props {
    children?: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  const LANG_STORAGE_KEY = 'platform.lang';
  let currentLang = $state<AvailableLanguageTag>(languageTag() as AvailableLanguageTag);
  let mobileOpen = $state(false);
  let burgerButton = $state<HTMLButtonElement | null>(null);

  const currentPath = $derived(page.url.pathname.replace(/\/$/, '') || '/');
  function isActive(href: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  interface NavItem {
    href: string;
    label: string;
    icon: 'ticket' | 'wallet' | 'scan';
    show: boolean;
  }
  const navItems = $derived(
    [
      { href: '/shop', label: 'Ticketshop', icon: 'ticket', show: isModuleEnabled('ticketshop') },
      {
        href: '/account/tickets',
        label: 'Meine Tickets',
        icon: 'wallet',
        show: !!auth.user && isModuleEnabled('ticketshop'),
      },
      {
        href: '/scan',
        label: 'Einlass-Scan',
        icon: 'scan',
        show: auth.isCrew && isModuleEnabled('ticketshop'),
      },
    ].filter((i) => i.show) as NavItem[],
  );

  $effect(() => {
    const userId = auth.user?.id;
    if (userId) void favorites.load();
    else if (auth.initialized) favorites.clear();
  });
  $effect(() => {
    if (browser) initAnalytics();
  });

  // Drawer-A11y: Escape schliesst, scroll-lock, Focus zurueck auf Burger.
  $effect(() => {
    if (!browser) return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      function onKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') mobileOpen = false;
      }
      window.addEventListener('keydown', onKeydown);
      return () => {
        window.removeEventListener('keydown', onKeydown);
        document.body.style.overflow = '';
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
    location.reload();
  }
</script>

{#snippet icon(name: string)}
  {#if name === 'ticket'}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="nav-icon">
      <path
        d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 6 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-6Z"
      />
      <path d="M15 7v10" stroke-dasharray="1.5 2.5" />
    </svg>
  {:else if name === 'wallet'}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="nav-icon">
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  {:else if name === 'scan'}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="nav-icon">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
      />
      <path d="M4 12h16" />
    </svg>
  {/if}
{/snippet}

{#snippet brand()}
  <a href="/shop" class="flex items-center gap-3" aria-label={instance.name}>
    <span class="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
      </svg>
    </span>
    <span class="text-[15px] font-semibold tracking-tight text-fg">{instance.name}</span>
  </a>
{/snippet}

{#snippet navList()}
  <nav class="flex flex-col gap-1">
    {#each navItems as item (item.href)}
      <a
        href={item.href}
        onclick={closeMobile}
        class="nav-link"
        class:nav-active={isActive(item.href)}
        aria-current={isActive(item.href) ? 'page' : undefined}
      >
        {@render icon(item.icon)}
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
{/snippet}

{#snippet footer()}
  <div class="mt-auto flex flex-col gap-2 pt-4">
    {#if auth.user}
      <a
        href="/account"
        onclick={closeMobile}
        class="nav-link"
        class:nav-active={isActive('/account')}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          class="nav-icon"
        >
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
        <span>Account</span>
      </a>
    {:else}
      <a href="/login" onclick={closeMobile} class="btn-cta">Anmelden</a>
    {/if}
    <button onclick={toggleLang} class="lang-toggle" aria-label="Sprache wechseln">
      <span class:on={currentLang === 'de'}>DE</span>
      <span class="opacity-40">/</span>
      <span class:on={currentLang === 'en'}>EN</span>
    </button>
  </div>
{/snippet}

{#if auth.viewAs}
  <div class="viewas-banner">
    Du siehst gerade als <strong>{auth.viewAs.displayName}</strong> ({auth.viewAs.email}).
    <button onclick={() => auth.exitViewAs()} class="viewas-exit">Aussteigen</button>
  </div>
{/if}

<div class="app-shell">
  <!-- Desktop-Sidebar -->
  <aside class="sidebar glass hidden lg:flex">
    <div class="mb-8">{@render brand()}</div>
    {@render navList()}
    {@render footer()}
  </aside>

  <!-- Content -->
  <div class="content lg:pl-64">
    <!-- Mobile-Topbar -->
    <header class="topbar glass flex lg:hidden">
      {@render brand()}
      <button
        bind:this={burgerButton}
        type="button"
        onclick={() => (mobileOpen = !mobileOpen)}
        aria-label={mobileOpen ? 'Menue schliessen' : 'Menue oeffnen'}
        aria-expanded={mobileOpen}
        class="burger"
      >
        <span></span><span></span><span></span>
      </button>
    </header>

    <main class="page">{@render children?.()}</main>
  </div>
</div>

<!-- Mobile-Drawer -->
{#if mobileOpen}
  <button class="scrim" aria-label="Menue schliessen" onclick={closeMobile}></button>
  <div class="drawer glass-strong" role="dialog" aria-modal="true" aria-label={instance.name}>
    <div class="mb-8">{@render brand()}</div>
    {@render navList()}
    {@render footer()}
  </div>
{/if}

<style>
  .app-shell {
    display: flex;
    min-height: 100vh;
  }
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 16rem;
    flex-direction: column;
    padding: 1.5rem 1rem;
    border-radius: 0;
    border-top: 0;
    border-bottom: 0;
    border-left: 0;
    z-index: 30;
  }
  .content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .page {
    flex: 1;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    border-radius: 0;
    border-top: 0;
    border-left: 0;
    border-right: 0;
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: var(--radius-md);
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    box-shadow:
      inset 0 1px 0 var(--glass-highlight),
      0 4px 16px var(--color-accent-glow);
  }
  .brand-mark svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  :global(.nav-icon) {
    width: 1.15rem;
    height: 1.15rem;
    flex-shrink: 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-md);
    color: var(--color-fg-muted);
    font-size: 0.925rem;
    font-weight: 500;
    text-decoration: none;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out),
      transform var(--dur-press) var(--ease-out);
  }
  .nav-link:active {
    transform: scale(0.98);
  }
  @media (hover: hover) and (pointer: fine) {
    .nav-link:hover {
      background-color: var(--glass-bg);
      color: var(--color-fg);
    }
  }
  .nav-active {
    color: var(--color-fg);
    background-color: var(--glass-bg-strong);
    box-shadow:
      inset 0 1px 0 var(--glass-highlight),
      inset 3px 0 0 var(--color-accent);
  }

  .btn-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 1rem;
    border-radius: var(--radius-pill);
    background-color: var(--color-accent);
    color: var(--color-fg-inverse);
    font-weight: 600;
    font-size: 0.925rem;
    text-decoration: none;
    box-shadow:
      inset 0 1px 0 var(--glass-highlight),
      0 6px 20px var(--color-accent-glow);
    transition: transform var(--dur-press) var(--ease-spring);
  }
  .btn-cta:active {
    transform: scale(0.97);
  }

  .lang-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--color-fg-muted);
    background: transparent;
    cursor: pointer;
    align-self: flex-start;
  }
  .lang-toggle .on {
    color: var(--color-accent);
  }

  .burger {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.6rem;
    border-radius: var(--radius-md);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
    cursor: pointer;
  }
  .burger span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: var(--color-fg);
    border-radius: 2px;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    border: 0;
    cursor: pointer;
    animation: fade 200ms var(--ease-out);
  }
  .drawer {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    width: min(20rem, 82vw);
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1.15rem;
    border-radius: 0;
    animation: slide-in 260ms var(--ease-drawer);
  }
  @keyframes slide-in {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .scrim {
      animation: none;
    }
  }

  .viewas-banner {
    position: sticky;
    top: 0;
    z-index: 60;
    padding: 0.5rem 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
  .viewas-exit {
    margin-left: 0.75rem;
    border: 1px solid var(--color-fg-inverse);
    border-radius: var(--radius-sm);
    padding: 0.1rem 0.5rem;
    cursor: pointer;
  }
</style>
