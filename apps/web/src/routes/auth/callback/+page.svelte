<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let errored = $state(false);
  let errorTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (!isAuthConfigured) {
      errored = true;
      return;
    }
    if (auth.user) {
      void goto('/account', { replaceState: true });
      return;
    }
    if (!errorTimer) {
      errorTimer = setTimeout(() => {
        if (!auth.user) errored = true;
      }, 8000);
    }
    return () => {
      if (errorTimer) {
        clearTimeout(errorTimer);
        errorTimer = undefined;
      }
    };
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
