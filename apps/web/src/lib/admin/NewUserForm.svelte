<script lang="ts">
  import { adminInvite, errorMessage, generatePassword } from '$lib/crew-api';
  import { DEFAULT_CREW_ROLES } from '$lib/crewResources';

  // Neuen User anlegen (Selbstregistrierung ist gesperrt). Wird unter
  // Admin -> User und Admin -> Crew verwendet.
  interface Props {
    onCreated?: () => void | Promise<void>;
    onCancel?: () => void;
  }
  let { onCreated, onCancel }: Props = $props();

  let email = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let phone = $state('');
  let isCrew = $state(true);
  let isAdmin = $state(false);
  let roles = $state<string[]>([]);
  let sendMail = $state(true);
  let withPassword = $state(false);
  let password = $state('');

  let saving = $state(false);
  let errorMsg = $state<string | null>(null);
  let result = $state<{
    email: string;
    mailRequested: boolean;
    mailSent: boolean;
    password: string;
  } | null>(null);

  function toggleRole(role: string) {
    roles = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
  }

  function togglePassword() {
    withPassword = !withPassword;
    if (withPassword && !password) password = generatePassword();
  }

  function resetForm() {
    email = firstName = lastName = phone = password = '';
    isCrew = true;
    isAdmin = false;
    roles = [];
    sendMail = true;
    withPassword = false;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;
    result = null;
    if (!withPassword && !sendMail) {
      errorMsg =
        'Ohne Willkommensmail braucht der User ein Startpasswort, sonst erfaehrt er nichts.';
      return;
    }
    if (withPassword && password.length < 10) {
      errorMsg = 'Das Startpasswort braucht mindestens 10 Zeichen.';
      return;
    }
    saving = true;
    try {
      const res = await adminInvite({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        is_crew: isCrew,
        crew_roles: isCrew ? roles : [],
        role: isAdmin ? 'admin' : 'user',
        password: withPassword ? password : undefined,
        send_mail: sendMail,
      });
      result = {
        email: email.trim().toLowerCase(),
        mailRequested: sendMail,
        mailSent: res.mailSent,
        password: withPassword ? password : '',
      };
      resetForm();
      await onCreated?.();
    } catch (err) {
      console.error('[admin] create user failed', err);
      errorMsg = errorMessage(err, 'User konnte nicht angelegt werden.');
    } finally {
      saving = false;
    }
  }
</script>

{#if result}
  <div class="card mt-4 flex flex-col gap-2 p-5" role="status">
    <p class="font-medium text-success">✓ {result.email} ist angelegt.</p>
    {#if result.mailSent}
      <p class="text-sm text-fg-muted">Die Willkommensmail ist unterwegs.</p>
    {:else if result.mailRequested}
      <p class="text-sm text-danger">
        Die Willkommensmail konnte nicht gesendet werden. Unter Admin → Crew kannst du sie erneut
        senden.
      </p>
    {/if}
    {#if result.password}
      <p class="text-sm text-fg">
        Startpasswort:
        <code class="ml-1 select-all rounded bg-black/30 px-2 py-0.5 font-mono text-accent"
          >{result.password}</code
        >
        <span class="block text-xs text-fg-muted">
          Wird nur jetzt angezeigt. Persoenlich weitergeben, nicht per Mail.
        </span>
      </p>
    {/if}
    <div><button type="button" class="pill" onclick={() => (result = null)}>OK</button></div>
  </div>
{/if}

<form onsubmit={submit} class="card mt-4 flex flex-col gap-5 p-6">
  <div>
    <h2 class="text-lg font-semibold text-fg">Neuen User anlegen</h2>
    <p class="mt-1 text-sm text-fg-muted">
      Selbst registrieren kann sich niemand. Die Person meldet sich per Login-Link aus der Mail an
      oder mit einem Startpasswort, das du ihr gibst.
    </p>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">Vorname</span>
      <input type="text" maxlength="80" bind:value={firstName} class="field mt-1" />
    </label>
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">Name</span>
      <input type="text" maxlength="80" bind:value={lastName} class="field mt-1" />
    </label>
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">E-Mail *</span>
      <input
        type="email"
        required
        maxlength="200"
        bind:value={email}
        class="field mt-1"
        placeholder="name@example.com"
      />
    </label>
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">Handynummer (optional)</span>
      <input
        type="tel"
        maxlength="30"
        bind:value={phone}
        class="field mt-1"
        placeholder="+49 170 1234567"
      />
    </label>
  </div>

  <div class="flex flex-col gap-2">
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" bind:checked={isCrew} /> Crew-Mitglied (Zugang zum Crew-Bereich)
    </label>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" bind:checked={isAdmin} /> Admin (darf alles, auch User und Rechte verwalten)
    </label>
  </div>

  {#if isCrew}
    <div>
      <span class="text-xs font-medium text-fg-muted">Rollen (optional)</span>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each DEFAULT_CREW_ROLES as role (role)}
          {@const on = roles.includes(role)}
          <button
            type="button"
            class="chip"
            class:chip-on={on}
            aria-pressed={on}
            onclick={() => toggleRole(role)}>{role}</button
          >
        {/each}
      </div>
      <p class="mt-1 text-xs text-fg-muted">
        Was eine Rolle darf, legst du unter <a href="/admin/berechtigungen" class="text-accent"
          >Rechte</a
        > fest.
      </p>
    </div>
  {/if}

  <div class="flex flex-col gap-2 border-t border-[color:var(--glass-border)] pt-4">
    <span class="text-xs font-medium text-fg-muted">Zugang</span>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" bind:checked={sendMail} /> Willkommensmail senden
    </label>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" checked={withPassword} onchange={togglePassword} /> Startpasswort festlegen
    </label>
    {#if withPassword}
      <div class="flex flex-wrap items-center gap-2 pl-6">
        <input
          type="text"
          minlength="10"
          maxlength="72"
          bind:value={password}
          class="field max-w-xs font-mono"
          aria-label="Startpasswort"
          autocomplete="off"
        />
        <button type="button" class="pill" onclick={() => (password = generatePassword())}>
          Neu erzeugen
        </button>
      </div>
    {/if}
  </div>

  {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}

  <div class="flex flex-wrap gap-2">
    <button class="pill pill-on" type="submit" disabled={saving || !email.trim()}>
      {saving ? 'Legt an …' : 'User anlegen'}
    </button>
    {#if onCancel}
      <button type="button" class="pill" onclick={onCancel} disabled={saving}>Abbrechen</button>
    {/if}
  </div>
</form>

<style>
  .pill,
  .chip {
    padding: 0.4rem 0.9rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--glass-border);
    background-color: var(--glass-bg);
    color: var(--color-fg);
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
  }
  .chip {
    color: var(--color-fg-muted);
    font-size: 0.8rem;
    padding: 0.35rem 0.8rem;
  }
  .pill:disabled,
  .chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pill-on,
  .chip-on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
    border-color: transparent;
  }
  @media (hover: hover) and (pointer: fine) {
    .pill:not(:disabled):not(.pill-on):hover,
    .chip:not(:disabled):not(.chip-on):hover {
      border-color: var(--color-accent);
      background-color: var(--glass-bg-strong);
      color: var(--color-fg);
    }
  }
</style>
