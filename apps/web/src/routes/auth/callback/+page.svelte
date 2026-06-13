<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let errored = $state(false);
  let errorTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    if (!isAuthConfigured) {
      errored = true;
      return;
    }

    // PKCE-Flow: Supabase legt nach Magic-Link-Klick ?code= in die URL.
    // `detectSessionInUrl: true` triggert das automatisch, aber bei
    // langsamer Netzanbindung oder wenn der Router den URL-Hash
    // umschreibt, geht das schief. Wir tauschen den Code explizit um.
    const url = window.location.href;
    if (auth.client && (url.includes('code=') || url.includes('access_token='))) {
      void auth.client.auth
        .exchangeCodeForSession(url)
        .catch((err) => console.warn('[callback] exchange failed', err));
    }

    // Fallback-Timer: wenn nach 8s immer noch kein User → Fehler-State.
    errorTimer = setTimeout(() => {
      if (!auth.user) errored = true;
    }, 8000);

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  });

  // Sobald der User auftaucht (durch exchangeCodeForSession oder
  // detectSessionInUrl), redirecten.
  $effect(() => {
    if (auth.user) {
      void goto('/account', { replaceState: true });
    }
  });
</script>

<svelte:head>
  <title>{m.callback_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    {#if errored}
      <Heading level={1} display>{m.callback_error_title()}</Heading>
      <p class="mt-6 text-fg-muted">{m.callback_error_body()}</p>
      <div class="mt-8">
        <Button href="/login" variant="yellow">{m.callback_retry()}</Button>
      </div>
    {:else}
      <Heading level={1} display>{m.callback_title()}</Heading>
      <p class="mt-6 text-fg-muted">{m.callback_body()}</p>
    {/if}
  </section>
</Container>
