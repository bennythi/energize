<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { m } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let email = $state('');
  let code = $state('');
  let otpId = $state<string | null>(null);
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  // Nach Auth-Resolution redirecten, falls schon eingeloggt.
  $effect(() => {
    if (!auth.loading && auth.user) {
      void goto('/account', { replaceState: true });
    }
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function requestCode(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    if (!emailRegex.test(email)) {
      errorMsg = m.login_error_invalid_email();
      return;
    }
    submitting = true;
    try {
      otpId = await auth.requestLoginCode(email);
    } catch (err) {
      console.error('[login] requestLoginCode failed', err);
      errorMsg = m.login_error_generic();
    } finally {
      submitting = false;
    }
  }

  async function submitCode(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    if (!otpId || code.trim().length < 4) {
      errorMsg = m.login_error_code();
      return;
    }
    submitting = true;
    try {
      await auth.confirmOtp(otpId, code.trim());
      await goto('/account', { replaceState: true });
    } catch (err) {
      console.error('[login] confirmOtp failed', err);
      errorMsg = m.login_error_code();
    } finally {
      submitting = false;
    }
  }

  function reset() {
    otpId = null;
    code = '';
    errorMsg = null;
  }
</script>

<svelte:head>
  <title>{m.login_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>{m.login_title()}</Heading>

    {#if !isAuthConfigured}
      <div class="mt-8 border-2 border-border bg-surface p-6">
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          {m.login_not_configured_title()}
        </h2>
        <p class="mt-3 text-sm text-fg-muted">{m.login_not_configured_body()}</p>
      </div>
    {:else if otpId}
      <p class="mt-6 text-fg-muted">{m.login_code_lead()}</p>

      <form onsubmit={submitCode} class="mt-8 space-y-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.login_code_label()}
          </span>
          <input
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            bind:value={code}
            placeholder={m.login_code_placeholder()}
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-lg tracking-[0.3em] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>

        {#if errorMsg}
          <p class="text-sm text-danger" role="alert">{errorMsg}</p>
        {/if}

        <div class="flex flex-wrap gap-2">
          <Button type="submit" variant="yellow">
            {submitting ? m.login_code_submitting() : m.login_code_submit()}
          </Button>
          <Button variant="ghost" onclick={reset}>{m.login_back()}</Button>
        </div>
      </form>
    {:else}
      <p class="mt-6 text-fg-muted">{m.login_lead()}</p>

      <form onsubmit={requestCode} class="mt-8 space-y-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.login_email_label()}
          </span>
          <input
            type="email"
            required
            autocomplete="email"
            bind:value={email}
            placeholder={m.login_email_placeholder()}
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>

        {#if errorMsg}
          <p class="text-sm text-danger" role="alert">{errorMsg}</p>
        {/if}

        <Button type="submit" variant="yellow">
          {submitting ? m.login_submitting() : m.login_submit()}
        </Button>
      </form>
    {/if}
  </section>
</Container>
