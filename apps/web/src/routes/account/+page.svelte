<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { m, languageTag, type AvailableLanguageTag } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import SupportSection from '$lib/SupportSection.svelte';
  import PasswordSection from '$lib/PasswordSection.svelte';
  import { homePath, isModuleEnabled } from '$lib/modules';
  import { t } from '$lib/i18n';

  const locale = $derived(languageTag() as AvailableLanguageTag);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

  const memberSince = $derived.by(() => {
    const created = auth.user?.created as string | undefined;
    if (!created) return null;
    return new Date(created).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // Profil-Felder aus dem Auth-Store (via ensureProfile geladen).
  let firstName = $state('');
  let lastName = $state('');
  let phone = $state('');
  let profileLoaded = $state(false);
  let savingProfile = $state(false);
  let profileSaved = $state(false);
  let profileError = $state<string | null>(null);

  // Sobald das Profil im Store da ist, Formularfelder befuellen (einmalig).
  $effect(() => {
    if (auth.profile && !profileLoaded) {
      firstName = auth.profile.first_name ?? '';
      lastName = auth.profile.last_name ?? '';
      phone = auth.profile.phone ?? '';
      profileLoaded = true;
    }
  });

  const phoneRegex = /^\+?[0-9 ()/-]{6,30}$/;

  async function handleProfileSave(event: SubmitEvent) {
    event.preventDefault();
    const pb = auth.pb;
    const profile = auth.profile;
    if (!pb || !profile) return;
    profileError = null;
    profileSaved = false;
    const cleanPhone = phone.trim();
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      profileError = t(
        'Bitte eine gueltige Handynummer eingeben, z. B. +49 170 1234567.',
        'Please enter a valid mobile number, e.g. +49 170 1234567.',
      );
      return;
    }
    savingProfile = true;
    try {
      const first = firstName.trim();
      const last = lastName.trim();
      const updated = await pb.collection('profiles').update(profile.id, {
        first_name: first,
        last_name: last,
        phone: cleanPhone,
        // Anzeigename (Admin- und Crew-Listen) folgt dem echten Namen.
        display_name: [first, last].filter(Boolean).join(' ') || profile.display_name,
      });
      auth.profile = updated as unknown as typeof auth.profile;
      phone = cleanPhone;
      profileSaved = true;
      setTimeout(() => (profileSaved = false), 3000);
    } catch (err) {
      console.error('[account] profile save failed', err);
      profileError = m.account_save_error();
    } finally {
      savingProfile = false;
    }
  }

  let signingOut = $state(false);
  async function handleLogout() {
    signingOut = true;
    try {
      await auth.signOut();
      await goto(homePath(), { replaceState: true });
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:head>
  <title>{m.account_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    {#if auth.loading}
      <p class="text-fg-muted">…</p>
    {:else if auth.user}
      <Heading level={1} display>{m.account_title()}</Heading>

      <dl class="mt-8 space-y-4 border-y border-border py-6">
        <div>
          <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.account_email_label()}
          </dt>
          <dd class="mt-1 font-mono text-base text-fg">{auth.user.email ?? ''}</dd>
        </div>
        {#if memberSince}
          <div>
            <dt class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
              {m.account_member_since()}
            </dt>
            <dd class="mt-1 font-mono text-base text-fg">{memberSince}</dd>
          </div>
        {/if}
      </dl>

      <section class="mt-12">
        <h2
          class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {m.account_profile_title()}
        </h2>

        <form onsubmit={handleProfileSave} class="mt-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {t('Vorname', 'First name')}
              </span>
              <input
                type="text"
                autocomplete="given-name"
                bind:value={firstName}
                disabled={!profileLoaded || savingProfile}
                maxlength="80"
                class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </label>
            <label class="block">
              <span
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {t('Name', 'Last name')}
              </span>
              <input
                type="text"
                autocomplete="family-name"
                bind:value={lastName}
                disabled={!profileLoaded || savingProfile}
                maxlength="80"
                class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </label>
            <label class="block sm:col-span-2">
              <span
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {t('Handynummer', 'Mobile number')}
              </span>
              <input
                type="tel"
                autocomplete="tel"
                bind:value={phone}
                placeholder="+49 170 1234567"
                disabled={!profileLoaded || savingProfile}
                maxlength="30"
                class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>
          <p class="text-xs text-fg-muted">
            {t(
              'Name und Handynummer sehen nur eingeloggte Crew-Mitglieder und Admins.',
              'Only signed-in crew members and admins can see your name and mobile number.',
            )}
          </p>

          {#if profileError}
            <p class="text-sm text-danger" role="alert">{profileError}</p>
          {/if}
          {#if profileSaved}
            <p class="text-sm text-success" aria-live="polite">✓ {m.account_saved()}</p>
          {/if}

          <Button type="submit" variant="yellow">
            {savingProfile ? m.account_saving() : m.account_save()}
          </Button>
        </form>
      </section>

      <PasswordSection />

      {#if isModuleEnabled('support')}
        <SupportSection />
      {/if}

      <div class="mt-12">
        <Button variant="ghost" onclick={handleLogout}>
          {signingOut ? '…' : m.account_logout()}
        </Button>
      </div>
    {/if}
  </section>
</Container>
