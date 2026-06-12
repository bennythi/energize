<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m, languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { favorites } from '$lib/favorites.svelte';
  import FavoriteButton from '$lib/FavoriteButton.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  const locale = $derived(languageTag() as AvailableLanguageTag);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

  const favoriteArtists = $derived(data.artists.filter((a) => favorites.has(a._id)));

  const memberSince = $derived.by(() => {
    const created = auth.user?.created_at;
    if (!created) return null;
    return new Date(created).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // Profile-Editing (display_name)
  let displayName = $state('');
  let handle = $state('');
  let displayNameLoaded = $state(false);
  let savingProfile = $state(false);
  let profileSaved = $state(false);
  let profileError = $state<string | null>(null);

  async function loadProfile() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;
    try {
      const { data, error } = await client
        .from('profiles')
        .select('display_name, handle')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      displayName = data?.display_name ?? '';
      handle = data?.handle ?? '';
    } catch (err) {
      console.error('[account] profile load failed', err);
    } finally {
      displayNameLoaded = true;
    }
  }

  onMount(() => {
    void loadProfile();
  });

  function normalizeHandle(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24);
  }

  async function handleProfileSave(event: SubmitEvent) {
    event.preventDefault();
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;
    profileError = null;
    profileSaved = false;
    savingProfile = true;
    try {
      const trimmedName = displayName.trim();
      const trimmedHandle = normalizeHandle(handle);
      const { error } = await client
        .from('profiles')
        .update({
          display_name: trimmedName || null,
          handle: trimmedHandle || null,
        })
        .eq('id', user.id);
      if (error) {
        if (error.code === '23505') {
          profileError = 'Handle ist schon vergeben.';
        } else {
          throw error;
        }
      } else {
        handle = trimmedHandle;
        profileSaved = true;
        setTimeout(() => (profileSaved = false), 3000);
      }
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
      await goto('/', { replaceState: true });
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

        <form onsubmit={handleProfileSave} class="mt-4 space-y-4">
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
              disabled={!displayNameLoaded || savingProfile}
              maxlength="40"
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
            <div
              class="mt-2 flex items-stretch border-2 border-border bg-bg focus-within:border-accent"
            >
              <span
                class="flex items-center px-3 font-mono text-base text-fg-muted"
                aria-hidden="true"
              >
                @
              </span>
              <input
                type="text"
                bind:value={handle}
                oninput={(e) => (handle = normalizeHandle((e.target as HTMLInputElement).value))}
                placeholder="dein_handle"
                disabled={!displayNameLoaded || savingProfile}
                maxlength="24"
                class="flex-1 bg-transparent py-3 pr-4 font-mono text-base text-fg placeholder:text-fg-muted focus:outline-none disabled:opacity-50"
              />
            </div>
            <p class="mt-2 text-xs text-fg-muted">
              Eindeutiger Username — a-z, 0-9, _ — wird in URLs verwendet.
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

          {#if handle}
            <p class="text-xs text-fg-muted">
              Dein Profil: <a href={`/u/${auth.user.id}`} class="text-accent hover:underline"
                >/u/{auth.user.id.slice(0, 8)}…</a
              >
            </p>
          {/if}
        </form>
      </section>

      <section class="mt-12 border-2 border-accent bg-surface p-6">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          {m.account_feedback_cta()}
        </p>
        <div class="mt-4">
          <Button href="/feedback" variant="yellow">{m.nav_feedback()} →</Button>
        </div>
      </section>

      <section class="mt-12">
        <h2
          class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {m.account_favorites_title()}
        </h2>

        {#if !favorites.initialized || favorites.loading}
          <p class="mt-4 text-sm text-fg-muted">{m.account_favorites_loading()}</p>
        {:else if favoriteArtists.length === 0}
          <p class="mt-4 text-sm text-fg-muted">{m.account_favorites_empty()}</p>
          <div class="mt-4">
            <Button href="/lineup" variant="ghost">{m.account_favorites_browse()}</Button>
          </div>
        {:else}
          <ul class="mt-4 divide-y divide-border border-y border-border">
            {#each favoriteArtists as artist (artist._id)}
              <li class="flex items-center justify-between gap-4 py-3">
                <span
                  class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                >
                  {artist.name}
                </span>
                <FavoriteButton artistId={artist._id} size="sm" />
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <div class="mt-12">
        <Button variant="ghost" onclick={handleLogout}>
          {signingOut ? '…' : m.account_logout()}
        </Button>
      </div>
    {/if}
  </section>
</Container>
