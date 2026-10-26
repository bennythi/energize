<script lang="ts">
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';

  // Passwort aendern. Pocketbase verlangt dafuer das aktuelle Passwort.
  // Accounts aus dem Code-Login haben ein unbekanntes Zufallspasswort; ein
  // Admin setzt dann unter Admin -> User ein Startpasswort.
  let oldPassword = $state('');
  let password = $state('');
  let confirm = $state('');
  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state<string | null>(null);

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

  const fieldCls =
    'mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50';
</script>

<section class="mt-12">
  <h2
    class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
  >
    Passwort
  </h2>
  <p class="mt-2 text-sm text-fg-muted">
    Damit meldest du dich ohne Code per E-Mail an. Kein aktuelles Passwort? Ein Admin kann dir unter
    Admin → User ein Startpasswort setzen.
  </p>

  <form onsubmit={save} class="mt-6 space-y-4">
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
