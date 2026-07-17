<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { m } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let errored = $state(false);
  let errorTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    if (!isAuthConfigured) {
      errored = true;
      return;
    }

    // Magic-Link-Variante: die Mail kann auf /auth/callback?otpId=..&code=..
    // verlinken. Wenn beide Parameter da sind, Login serverseitig abschliessen.
    const params = new URLSearchParams(window.location.search);
    const otpId = params.get('otpId');
    const code = params.get('code');
    if (otpId && code) {
      void auth.confirmOtp(otpId, code).catch((err) => {
        console.warn('[callback] confirmOtp failed', err);
        errored = true;
      });
    }

    // Fallback: nach 8s ohne User => Fehler-State.
    errorTimer = setTimeout(() => {
      if (!auth.user) errored = true;
    }, 8000);

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  });

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
