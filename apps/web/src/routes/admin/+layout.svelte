<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { isModuleEnabled } from '$lib/modules';

  interface Props {
    children?: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  // Gate: nur Admins. Nicht-Admins landen still auf ihrem Account.
  $effect(() => {
    if (!isAuthConfigured) return;
    if (auth.loading || !auth.adminChecked) return;
    if (!auth.user) void goto('/login', { replaceState: true });
    else if (!auth.isAdmin) void goto('/account', { replaceState: true });
  });

  const currentPath = $derived(page.url.pathname.replace(/\/$/, ''));

  const links = $derived(
    [
      { href: '/admin', label: 'Uebersicht', show: true },
      { href: '/admin/users', label: 'User', show: true },
      { href: '/admin/crew', label: 'Crew', show: isModuleEnabled('crew-core') },
      { href: '/admin/berechtigungen', label: 'Rechte', show: isModuleEnabled('crew-core') },
      { href: '/admin/briefings', label: 'Briefings', show: isModuleEnabled('crew-briefings') },
      {
        href: '/admin/meilensteine',
        label: 'Meilensteine',
        show: isModuleEnabled('crew-milestones'),
      },
      { href: '/admin/cashless-kassen', label: 'Kassen', show: isModuleEnabled('cashless') },
    ].filter((l) => l.show),
  );
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

{#if auth.loading || !auth.adminChecked}
  <div class="mx-auto w-full max-w-5xl px-5 py-16">
    <div class="card h-40 animate-pulse opacity-50"></div>
  </div>
{:else if auth.user && auth.isAdmin}
  <div class="mx-auto w-full max-w-6xl px-5 pt-8 md:pt-12">
    <nav class="tabs" aria-label="Admin-Bereiche">
      {#each links as link (link.href)}
        <a
          href={link.href}
          class="tab"
          class:tab-on={currentPath === link.href}
          aria-current={currentPath === link.href ? 'page' : undefined}>{link.label}</a
        >
      {/each}
    </nav>
  </div>
  {@render children?.()}
{/if}

<style>
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .tab {
    padding: 0.45rem 0.9rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg-muted);
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  @media (hover: hover) and (pointer: fine) {
    .tab:hover {
      color: var(--color-fg);
      background-color: var(--glass-bg-strong);
    }
  }
  .tab-on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    border-color: transparent;
  }
</style>
