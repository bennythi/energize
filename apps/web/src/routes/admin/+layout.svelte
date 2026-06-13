<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Container } from '@energize/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Guard: nur Admins kommen rein
  $effect(() => {
    if (!isAuthConfigured) return;
    if (auth.loading || !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
    } else if (!auth.isAdmin) {
      // Nicht-Admins → redirect zur Home, nicht 403 leaken
      void goto('/', { replaceState: true });
    }
  });

  const currentPath = $derived(page.url.pathname.replace(/\/$/, ''));
  const isActive = (href: string) => currentPath === href;

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/feedback', label: 'Feedback' },
    { href: '/admin/users', label: 'User' },
    { href: '/admin/tools', label: 'Tools' },
  ];
</script>

<svelte:head>
  <title>Admin — ENERGIZE</title>
</svelte:head>

{#if !isAuthConfigured}
  <Container size="sm">
    <div class="py-24 text-center">
      <p class="text-fg-muted">Admin-Bereich nicht verfügbar.</p>
    </div>
  </Container>
{:else if auth.loading || !auth.adminChecked}
  <Container size="sm">
    <div class="py-24 text-center">
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Lade …
      </p>
    </div>
  </Container>
{:else if !auth.user || !auth.isAdmin}
  <!-- Redirect läuft im $effect — Render nichts -->
{:else}
  <div class="admin-shell min-h-[calc(100vh-4rem)] bg-bg">
    <!-- Admin-Sub-Nav -->
    <div class="border-b-2 border-accent bg-surface">
      <Container>
        <div class="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-baseline gap-3">
            <span class="plakat px-2 py-0.5 font-mono text-[10px]">ADMIN</span>
            <span
              class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              eingeloggt als {auth.user.email}
            </span>
          </div>

          <ul
            class="flex flex-wrap gap-1 font-mono text-xs uppercase tracking-[var(--tracking-claim)]"
          >
            {#each adminLinks as link (link.href)}
              <li>
                <a
                  href={link.href}
                  class="admin-link inline-block border-2 px-3 py-2 transition-colors"
                  class:admin-link-active={isActive(link.href)}
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </Container>
    </div>

    {@render children?.()}
  </div>
{/if}

<style>
  .admin-link {
    border-color: var(--color-border);
    color: var(--color-fg-muted);
  }
  @media (hover: hover) and (pointer: fine) {
    .admin-link:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
  }
  .admin-link-active {
    border-color: var(--color-accent);
    background-color: var(--color-accent);
    color: var(--color-fg-inverse);
  }
</style>
