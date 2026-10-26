<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  // Gate: nur eingeloggte Crew/Admins. Feinrechte pruefen die Seiten selbst
  // (und serverseitig der Crew-Guard in Pocketbase).
  $effect(() => {
    if (!isAuthConfigured) return;
    if (auth.loading || !auth.adminChecked) return;
    if (!auth.user) void goto('/login', { replaceState: true });
    else if (!auth.isCrew) void goto('/account', { replaceState: true });
  });
</script>

{#if auth.loading || !auth.adminChecked}
  <div class="mx-auto w-full max-w-5xl px-5 py-16">
    <div class="card h-40 animate-pulse opacity-50"></div>
  </div>
{:else if auth.user && auth.isCrew}
  {@render children?.()}
{/if}
