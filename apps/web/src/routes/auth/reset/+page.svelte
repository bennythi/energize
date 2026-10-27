<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';

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
      errorMsg = 'Das Passwort braucht mindestens 10 Zeichen.';
      return;
    }
    if (password !== confirm) {
      errorMsg = 'Die beiden Passwoerter stimmen nicht ueberein.';
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
      errorMsg =
        'Der Link ist abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Neues Passwort</title>
</svelte:head>

<div class="mx-auto w-full max-w-md px-5 py-14 md:py-20">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Neues Passwort</h1>

  {#if done}
    <div class="card mt-8 flex flex-col gap-4 p-6">
      <p class="font-medium text-fg">✓ Passwort gespeichert</p>
      <p class="text-sm text-fg-muted">Du kannst dich jetzt mit dem neuen Passwort anmelden.</p>
      <div><Button href="/login">Zum Login</Button></div>
    </div>
  {:else if !token}
    <div class="card mt-8 flex flex-col gap-4 p-6">
      <p class="text-sm text-fg-muted">
        Der Link ist unvollstaendig. Oeffne ihn bitte direkt aus der Mail oder fordere auf der
        Login-Seite einen neuen an.
      </p>
      <div><Button href="/login" variant="ghost">Zum Login</Button></div>
    </div>
  {:else}
    <form onsubmit={save} class="card mt-8 flex flex-col gap-4 p-6">
      <label class="block">
        <span class="text-xs font-medium text-fg-muted">Neues Passwort</span>
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
        <span class="text-xs font-medium text-fg-muted">Neues Passwort wiederholen</span>
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
      <div><Button type="submit">{saving ? 'Speichert …' : 'Passwort speichern'}</Button></div>
    </form>
  {/if}
</div>
