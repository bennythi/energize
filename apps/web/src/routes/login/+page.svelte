<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
  import { m } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { afterLoginPath, isModuleEnabled } from '$lib/modules';

  // Ohne Ticketshop ist die Instanz ein interner Orga-Bereich: dort ist der
  // Passwort-Login Standard (unabhaengig von Mail-Zustellung), Code per Mail
  // bleibt als Alternative.
  let mode = $state<'password' | 'code'>(isModuleEnabled('ticketshop') ? 'code' : 'password');

  let email = $state('');
  let password = $state('');
  let code = $state('');
  let otpId = $state<string | null>(null);
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!auth.loading && auth.user && auth.adminChecked && !submitting) {
      void goto(afterLoginPath(auth.isCrew), { replaceState: true });
    }
  });

  // Aus der Willkommensmail: /login/?email=...&mode=code
  onMount(() => {
    const params = new URLSearchParams(location.search);
    const preset = params.get('email');
    if (preset) email = preset;
    if (params.get('mode') === 'code') mode = 'code';
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function signInPassword(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    if (!emailRegex.test(email)) {
      errorMsg = m.login_error_invalid_email();
      return;
    }
    if (!password) {
      errorMsg = 'Bitte gib dein Passwort ein.';
      return;
    }
    submitting = true;
    try {
      await auth.signInWithPassword(email, password);
      await goto(afterLoginPath(auth.isCrew), { replaceState: true });
    } catch (err) {
      console.error('[login] password failed', err);
      errorMsg = 'E-Mail oder Passwort stimmt nicht.';
    } finally {
      submitting = false;
    }
  }

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
      await goto(afterLoginPath(auth.isCrew), { replaceState: true });
    } catch (err) {
      console.error('[login] confirmOtp failed', err);
      errorMsg = m.login_error_code();
    } finally {
      submitting = false;
    }
  }

  let resetInfo = $state<string | null>(null);
  async function forgotPassword() {
    errorMsg = null;
    resetInfo = null;
    if (!emailRegex.test(email)) {
      errorMsg = 'Trag oben deine E-Mail-Adresse ein, dann schicken wir dir einen Link.';
      return;
    }
    submitting = true;
    try {
      await auth.requestPasswordReset(email);
      resetInfo = `Wenn ${email.trim()} bei uns angelegt ist, kommt gleich eine Mail mit einem Link.`;
    } catch (err) {
      console.error('[login] password reset failed', err);
      const status = (err as { status?: number }).status;
      errorMsg =
        status === 429 ? 'Zu viele Versuche. Bitte warte eine Minute.' : m.login_error_generic();
    } finally {
      submitting = false;
    }
  }

  function reset() {
    otpId = null;
    code = '';
    errorMsg = null;
  }

  function switchMode(next: 'password' | 'code') {
    mode = next;
    errorMsg = null;
    resetInfo = null;
    otpId = null;
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
  {:else}
    <p class="mt-3 text-sm text-fg-muted">
      Zugang nur fuer die Crew. Konten legt ein Admin an, du bekommst dann eine Willkommensmail.
    </p>
    <div class="seg mt-6" role="group" aria-label="Anmeldeart">
      <button
        type="button"
        class:on={mode === 'password'}
        aria-pressed={mode === 'password'}
        onclick={() => switchMode('password')}>Passwort</button
      >
      <button
        type="button"
        class:on={mode === 'code'}
        aria-pressed={mode === 'code'}
        onclick={() => switchMode('code')}>Code per E-Mail</button
      >
    </div>

    {#if mode === 'password'}
      <form onsubmit={signInPassword} class="card mt-4 flex flex-col gap-4 p-6">
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">{m.login_email_label()}</span>
          <input
            type="email"
            required
            autocomplete="username"
            bind:value={email}
            placeholder={m.login_email_placeholder()}
            disabled={submitting}
            class="field mt-2"
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">Passwort</span>
          <input
            type="password"
            required
            autocomplete="current-password"
            bind:value={password}
            disabled={submitting}
            class="field mt-2"
          />
        </label>
        {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}
        <div>
          <Button type="submit">{submitting ? 'Pruefe …' : 'Einloggen'}</Button>
        </div>
        {#if resetInfo}<p class="text-sm text-success" aria-live="polite">{resetInfo}</p>{/if}
        <p class="text-xs text-fg-muted">
          Noch kein Passwort oder vergessen?
          <button
            type="button"
            class="text-accent underline"
            disabled={submitting}
            onclick={() => void forgotPassword()}>Link zum Zuruecksetzen schicken</button
          >
        </p>
      </form>
    {:else if otpId}
      <p class="mt-4 text-fg-muted">{m.login_code_lead()}</p>
      <form onsubmit={submitCode} class="card mt-4 flex flex-col gap-4 p-6">
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
      <form onsubmit={requestCode} class="card mt-4 flex flex-col gap-4 p-6">
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
          <Button type="submit">{submitting ? m.login_submitting() : 'Code senden'}</Button>
        </div>
      </form>
    {/if}
  {/if}
</div>

<style>
  .seg {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .seg button {
    padding: 0.4rem 0.9rem;
    border-radius: var(--radius-pill);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    background: transparent;
    cursor: pointer;
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }
</style>
