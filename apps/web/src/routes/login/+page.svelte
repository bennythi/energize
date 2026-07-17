<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { m } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let email = $state('');
  let code = $state('');
  let otpId = $state<string | null>(null);
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!auth.loading && auth.user) void goto('/account', { replaceState: true });
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
  <title>{m.login_title()}</title>
</svelte:head>

<div class="mx-auto w-full max-w-md px-5 py-14 md:py-20">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">{m.login_title()}</h1>

  {#if !isAuthConfigured}
    <div class="card mt-8 p-6">
      <h2 class="font-semibold text-fg">{m.login_not_configured_title()}</h2>
      <p class="mt-2 text-sm text-fg-muted">{m.login_not_configured_body()}</p>
    </div>
  {:else if otpId}
    <p class="mt-3 text-fg-muted">{m.login_code_lead()}</p>
    <form onsubmit={submitCode} class="card mt-6 flex flex-col gap-4 p-6">
      <label class="block">
        <span class="text-xs font-medium text-fg-muted">{m.login_code_label()}</span>
        <input
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          bind:value={code}
          placeholder={m.login_code_placeholder()}
          disabled={submitting}
          class="field mt-2 text-lg tracking-[0.3em]"
        />
      </label>
      {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}
      <div class="flex flex-wrap gap-3">
        <Button type="submit"
          >{submitting ? m.login_code_submitting() : m.login_code_submit()}</Button
        >
        <Button variant="ghost" onclick={reset}>{m.login_back()}</Button>
      </div>
    </form>
  {:else}
    <p class="mt-3 text-fg-muted">{m.login_lead()}</p>
    <form onsubmit={requestCode} class="card mt-6 flex flex-col gap-4 p-6">
      <label class="block">
        <span class="text-xs font-medium text-fg-muted">{m.login_email_label()}</span>
        <input
          type="email"
          required
          autocomplete="email"
          bind:value={email}
          placeholder={m.login_email_placeholder()}
          disabled={submitting}
          class="field mt-2"
        />
      </label>
      {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}
      <div>
        <Button type="submit">{submitting ? m.login_submitting() : m.login_submit()}</Button>
      </div>
    </form>
  {/if}
</div>
