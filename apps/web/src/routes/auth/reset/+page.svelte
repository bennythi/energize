<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { t } from '$lib/i18n';

  // Ziel des Links aus der Mail "Passwort zuruecksetzen": /auth/reset/?token=...
  let token = $state('');
  let password = $state('');
  let confirm = $state('');
  let saving = $state(false);
  let done = $state(false);
  let errorMsg = $state<string | null>(null);

  onMount(() => {
    token = new URLSearchParams(location.search).get('token') ?? '';
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    if (password.length < 10) {
      errorMsg = t(
        'Das Passwort braucht mindestens 10 Zeichen.',
        'The password needs at least 10 characters.',
      );
      return;
    }
    if (password !== confirm) {
      errorMsg = t(
        'Die beiden Passwoerter stimmen nicht ueberein.',
        'The two passwords do not match.',
      );
      return;
    }
    saving = true;
    try {
      await auth.confirmPasswordReset(token, password);
      // Alte Sitzungen sind danach ungueltig.
      await auth.signOut();
      done = true;
    } catch (err) {
      console.error('[reset] confirm failed', err);
      errorMsg = t(
        'Der Link ist abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.',
        'The link has expired or was already used. Just request a new one.',
      );
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{t('Neues Passwort', 'New password')}</title>
</svelte:head>

<div class="mx-auto w-full max-w-md px-5 py-14 md:py-20">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
    {t('Neues Passwort', 'New password')}
  </h1>

  {#if done}
    <div class="card mt-8 flex flex-col gap-4 p-6">
      <p class="font-medium text-fg">✓ {t('Passwort gespeichert', 'Password saved')}</p>
      <p class="text-sm text-fg-muted">
        {t(
          'Du kannst dich jetzt mit dem neuen Passwort anmelden.',
          'You can now sign in with your new password.',
        )}
      </p>
      <div><Button href="/login">{t('Zum Login', 'Go to sign-in')}</Button></div>
    </div>
  {:else if !token}
    <div class="card mt-8 flex flex-col gap-4 p-6">
      <p class="text-sm text-fg-muted">
        {t(
          'Der Link ist unvollstaendig. Oeffne ihn bitte direkt aus der Mail oder fordere auf der Login-Seite einen neuen an.',
          'The link is incomplete. Please open it directly from the email or request a new one on the sign-in page.',
        )}
      </p>
      <div>
        <Button href="/login" variant="ghost">{t('Zum Login', 'Go to sign-in')}</Button>
      </div>
    </div>
  {:else}
    <form onsubmit={save} class="card mt-8 flex flex-col gap-4 p-6">
      <label class="block">
        <span class="text-xs font-medium text-fg-muted">{t('Neues Passwort', 'New password')}</span>
        <input
          type="password"
          autocomplete="new-password"
          minlength="10"
          required
          bind:value={password}
          disabled={saving}
          class="field mt-2"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-fg-muted"
          >{t('Neues Passwort wiederholen', 'Repeat new password')}</span
        >
        <input
          type="password"
          autocomplete="new-password"
          required
          bind:value={confirm}
          disabled={saving}
          class="field mt-2"
        />
      </label>
      {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}
      <div>
        <Button type="submit"
          >{saving
            ? t('Speichert …', 'Saving …')
            : t('Passwort speichern', 'Save password')}</Button
        >
      </div>
    </form>
  {/if}
</div>
