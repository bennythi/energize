<script lang="ts">
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';

  // Passwort aendern. Pocketbase verlangt dafuer das aktuelle Passwort.
  // Wer es nicht kennt (z. B. Konto vom Admin angelegt), setzt es per Mail zurueck.
  let oldPassword = $state('');
  let password = $state('');
  let confirm = $state('');
  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state<string | null>(null);

  let sendingReset = $state(false);
  let resetSent = $state(false);
  let resetError = $state<string | null>(null);

  async function save(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    saved = false;
    if (password.length < 10) {
      errorMsg = 'Das neue Passwort braucht mindestens 10 Zeichen.';
      return;
    }
    if (password !== confirm) {
      errorMsg = 'Die beiden neuen Passwoerter stimmen nicht ueberein.';
      return;
    }
    saving = true;
    try {
      await auth.changePassword(oldPassword, password);
      oldPassword = password = confirm = '';
      saved = true;
    } catch (err) {
      console.error('[account] password change failed', err);
      errorMsg = 'Aendern fehlgeschlagen. Stimmt das aktuelle Passwort?';
    } finally {
      saving = false;
    }
  }

  async function sendReset() {
    const email = auth.user?.email;
    if (!email) return;
    resetError = null;
    sendingReset = true;
    try {
      await auth.requestPasswordReset(email);
      resetSent = true;
    } catch (err) {
      console.error('[account] password reset failed', err);
      const status = (err as { status?: number }).status;
      resetError =
        status === 429
          ? 'Zu viele Versuche. Bitte warte eine Minute.'
          : 'Die Mail konnte nicht verschickt werden.';
    } finally {
      sendingReset = false;
    }
  }

  const fieldCls =
    'mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50';
</script>

<section class="mt-12">
  <h2
    class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
  >
    Passwort
  </h2>

  <div class="mt-4 border-2 border-border p-4">
    <p class="text-sm text-fg">Passwort vergessen oder nie eins gesetzt?</p>
    <p class="mt-1 text-sm text-fg-muted">
      Wir schicken dir einen Link an {auth.user?.email ?? 'deine E-Mail'}, damit legst du ein neues
      fest.
    </p>
    <div class="mt-3">
      {#if resetSent}
        <p class="text-sm text-success" aria-live="polite">
          ✓ Mail ist unterwegs. Schau in dein Postfach (auch in den Spam-Ordner).
        </p>
      {:else}
        <Button variant="ghost" onclick={() => void sendReset()} disabled={sendingReset}>
          {sendingReset ? 'Sendet …' : 'Passwort zuruecksetzen'}
        </Button>
      {/if}
      {#if resetError}<p class="mt-2 text-sm text-danger" role="alert">{resetError}</p>{/if}
    </div>
  </div>

  <p class="mt-8 text-sm text-fg-muted">Oder direkt aendern, wenn du dein aktuelles kennst:</p>

  <form onsubmit={save} class="mt-4 space-y-4">
    <input type="email" class="hidden" autocomplete="username" value={auth.user?.email ?? ''} />
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Aktuelles Passwort
      </span>
      <input
        type="password"
        autocomplete="current-password"
        bind:value={oldPassword}
        disabled={saving}
        class={fieldCls}
      />
    </label>
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Neues Passwort
      </span>
      <input
        type="password"
        autocomplete="new-password"
        minlength="10"
        bind:value={password}
        disabled={saving}
        class={fieldCls}
      />
    </label>
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
        Neues Passwort wiederholen
      </span>
      <input
        type="password"
        autocomplete="new-password"
        bind:value={confirm}
        disabled={saving}
        class={fieldCls}
      />
    </label>
    {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}
    {#if saved}<p class="text-sm text-success" aria-live="polite">✓ Passwort gespeichert</p>{/if}
    <Button type="submit">{saving ? 'Speichert …' : 'Passwort speichern'}</Button>
  </form>
</section>
