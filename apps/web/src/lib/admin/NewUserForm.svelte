<script lang="ts">
  import { adminInvite, errorMessage, generatePassword } from '$lib/crew-api';
  import { DEFAULT_CREW_ROLES } from '$lib/crewResources';
  import { t } from '$lib/i18n';

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
      errorMsg = t(
        'Ohne Willkommensmail braucht der User ein Startpasswort, sonst erfaehrt er nichts.',
        'Without a welcome email the user needs an initial password, otherwise they will never know.',
      );
      return;
    }
    if (withPassword && password.length < 10) {
      errorMsg = t(
        'Das Startpasswort braucht mindestens 10 Zeichen.',
        'The initial password needs at least 10 characters.',
      );
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
      errorMsg = errorMessage(
        err,
        t('User konnte nicht angelegt werden.', 'User could not be created.'),
      );
    } finally {
      saving = false;
    }
  }
</script>

{#if result}
  <div class="card mt-4 flex flex-col gap-2 p-5" role="status">
    <p class="font-medium text-success">
      ✓ {result.email}
      {t('ist angelegt.', 'has been created.')}
    </p>
    {#if result.mailSent}
      <p class="text-sm text-fg-muted">
        {t('Die Willkommensmail ist unterwegs.', 'The welcome email is on its way.')}
      </p>
    {:else if result.mailRequested}
      <p class="text-sm text-danger">
        {t(
          'Die Willkommensmail konnte nicht gesendet werden. Unter Admin → Crew kannst du sie erneut senden.',
          'The welcome email could not be sent. You can resend it under Admin → Crew.',
        )}
      </p>
    {/if}
    {#if result.password}
      <p class="text-sm text-fg">
        {t('Startpasswort:', 'Initial password:')}
        <code class="ml-1 select-all rounded bg-black/30 px-2 py-0.5 font-mono text-accent"
          >{result.password}</code
        >
        <span class="block text-xs text-fg-muted">
          {t(
            'Wird nur jetzt angezeigt. Persoenlich weitergeben, nicht per Mail.',
            'Shown only now. Hand it over in person, not by email.',
          )}
        </span>
      </p>
    {/if}
    <div><button type="button" class="pill" onclick={() => (result = null)}>OK</button></div>
  </div>
{/if}

<form onsubmit={submit} class="card mt-4 flex flex-col gap-5 p-6">
  <div>
    <h2 class="text-lg font-semibold text-fg">{t('Neuen User anlegen', 'Create new user')}</h2>
    <p class="mt-1 text-sm text-fg-muted">
      {t(
        'Selbst registrieren kann sich niemand. Die Person meldet sich per Login-Link aus der Mail an oder mit einem Startpasswort, das du ihr gibst.',
        'Nobody can sign up on their own. The person logs in via the login link in the email or with an initial password you give them.',
      )}
    </p>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">{t('Vorname', 'First name')}</span>
      <input type="text" maxlength="80" bind:value={firstName} class="field mt-1" />
    </label>
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">{t('Name', 'Last name')}</span>
      <input type="text" maxlength="80" bind:value={lastName} class="field mt-1" />
    </label>
    <label class="block">
      <span class="text-xs font-medium text-fg-muted">{t('E-Mail', 'Email')} *</span>
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
      <span class="text-xs font-medium text-fg-muted"
        >{t('Handynummer (optional)', 'Mobile number (optional)')}</span
      >
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
      <input type="checkbox" bind:checked={isCrew} />
      {t('Crew-Mitglied (Zugang zum Crew-Bereich)', 'Crew member (access to the crew area)')}
    </label>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" bind:checked={isAdmin} />
      {t(
        'Admin (darf alles, auch User und Rechte verwalten)',
        'Admin (can do everything, including managing users and permissions)',
      )}
    </label>
  </div>

  {#if isCrew}
    <div>
      <span class="text-xs font-medium text-fg-muted"
        >{t('Rollen (optional)', 'Roles (optional)')}</span
      >
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
        {t('Was eine Rolle darf, legst du unter', 'You define what a role may do under')}
        <a href="/admin/berechtigungen" class="text-accent">{t('Rechte', 'Permissions')}</a>{t(
          ' fest.',
          '.',
        )}
      </p>
    </div>
  {/if}

  <div class="flex flex-col gap-2 border-t border-[color:var(--glass-border)] pt-4">
    <span class="text-xs font-medium text-fg-muted">{t('Zugang', 'Access')}</span>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" bind:checked={sendMail} />
      {t('Willkommensmail senden', 'Send welcome email')}
    </label>
    <label class="flex items-center gap-2 text-sm text-fg">
      <input type="checkbox" checked={withPassword} onchange={togglePassword} />
      {t('Startpasswort festlegen', 'Set initial password')}
    </label>
    {#if withPassword}
      <div class="flex flex-wrap items-center gap-2 pl-6">
        <input
          type="text"
          minlength="10"
          maxlength="72"
          bind:value={password}
          class="field max-w-xs font-mono"
          aria-label={t('Startpasswort', 'Initial password')}
          autocomplete="off"
        />
        <button type="button" class="pill" onclick={() => (password = generatePassword())}>
          {t('Neu erzeugen', 'Generate new')}
        </button>
      </div>
    {/if}
  </div>

  {#if errorMsg}<p class="text-sm text-danger" role="alert">{errorMsg}</p>{/if}

  <div class="flex flex-wrap gap-2">
    <button class="pill pill-on" type="submit" disabled={saving || !email.trim()}>
      {saving ? t('Legt an …', 'Creating …') : t('User anlegen', 'Create user')}
    </button>
    {#if onCancel}
      <button type="button" class="pill" onclick={onCancel} disabled={saving}
        >{t('Abbrechen', 'Cancel')}</button
      >
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
