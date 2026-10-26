<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { m, languageTag, type AvailableLanguageTag } from '@platform/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import SupportSection from '$lib/SupportSection.svelte';
  import PasswordSection from '$lib/PasswordSection.svelte';
  import { homePath, isModuleEnabled } from '$lib/modules';

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
  let displayName = $state('');
  let handle = $state('');
  let profileLoaded = $state(false);
  let savingProfile = $state(false);
  let profileSaved = $state(false);
  let profileError = $state<string | null>(null);

  // Sobald das Profil im Store da ist, Formularfelder befuellen (einmalig).
  $effect(() => {
    if (auth.profile && !profileLoaded) {
      displayName = auth.profile.display_name ?? '';
      handle = auth.profile.handle ?? '';
      profileLoaded = true;
    }
  });

  function slugifyHandle(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
  }

  async function handleProfileSave(event: SubmitEvent) {
    event.preventDefault();
    const pb = auth.pb;
    const profile = auth.profile;
    if (!pb || !profile) return;
    profileError = null;
    profileSaved = false;
    savingProfile = true;
    try {
      const cleanHandle = slugifyHandle(handle);
      const updated = await pb.collection('profiles').update(profile.id, {
        display_name: displayName.trim(),
        handle: cleanHandle,
      });
      auth.profile = updated as unknown as typeof auth.profile;
      handle = cleanHandle;
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
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              {m.account_display_name_label()}
            </span>
            <input
              type="text"
              bind:value={displayName}
              placeholder={m.account_display_name_placeholder()}
              disabled={!profileLoaded || savingProfile}
              maxlength="80"
              class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <p class="mt-2 text-xs text-fg-muted">{m.account_display_name_hint()}</p>
          </label>

          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              Handle
            </span>
            <input
              type="text"
              bind:value={handle}
              placeholder="dein_handle"
              disabled={!profileLoaded || savingProfile}
              maxlength="40"
              class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <p class="mt-2 text-xs text-fg-muted">
              Kleinbuchstaben, Zahlen und Unterstriche. Muss eindeutig sein.
            </p>
          </label>

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
