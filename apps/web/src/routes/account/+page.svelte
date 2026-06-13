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

  // Profile-Editing — User editiert nur den Display-Name,
  // Handle wird automatisch aus dem Namen abgeleitet.
  let displayName = $state('');
  let handle = $state('');
  let phone = $state('');
  let birthdate = $state('');
  let postalCode = $state('');
  let country = $state('DE');
  let festivalsAttended = $state(0);
  let displayNameLoaded = $state(false);
  let savingProfile = $state(false);
  let profileSaved = $state(false);
  let profileError = $state<string | null>(null);
  let handleColumnAvailable = $state(true);
  let extendedColumnsAvailable = $state(true);

  const countries: { code: string; label: string }[] = [
    { code: 'DE', label: '🇩🇪 Deutschland' },
    { code: 'AT', label: '🇦🇹 Österreich' },
    { code: 'CH', label: '🇨🇭 Schweiz' },
    { code: 'NL', label: '🇳🇱 Niederlande' },
    { code: 'BE', label: '🇧🇪 Belgien' },
    { code: 'LU', label: '🇱🇺 Luxemburg' },
    { code: 'DK', label: '🇩🇰 Dänemark' },
    { code: 'PL', label: '🇵🇱 Polen' },
    { code: 'CZ', label: '🇨🇿 Tschechien' },
    { code: 'FR', label: '🇫🇷 Frankreich' },
    { code: 'IT', label: '🇮🇹 Italien' },
    { code: 'GB', label: '🇬🇧 UK' },
    { code: 'SE', label: '🇸🇪 Schweden' },
    { code: 'NO', label: '🇳🇴 Norwegen' },
    { code: 'XX', label: '🌍 Anderes Land' },
  ];

  async function loadProfile() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;
    try {
      const { data, error } = await client
        .from('profiles')
        .select('display_name, handle, phone, birthdate, postal_code, country, festivals_attended')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        if (error.code === '42703') {
          // Eine der Spalten fehlt. Mit weniger select probieren.
          extendedColumnsAvailable = false;
          const retry = await client
            .from('profiles')
            .select('display_name, handle')
            .eq('id', user.id)
            .maybeSingle();
          if (retry.error && retry.error.code === '42703') {
            // handle fehlt auch (Migration 0004)
            handleColumnAvailable = false;
            const fallback = await client
              .from('profiles')
              .select('display_name')
              .eq('id', user.id)
              .maybeSingle();
            if (fallback.error) throw fallback.error;
            displayName = fallback.data?.display_name ?? '';
          } else if (retry.error) {
            throw retry.error;
          } else {
            displayName = retry.data?.display_name ?? '';
            handle = retry.data?.handle ?? '';
          }
        } else {
          throw error;
        }
      } else {
        displayName = data?.display_name ?? '';
        handle = data?.handle ?? '';
        phone = data?.phone ?? '';
        birthdate = data?.birthdate ?? '';
        postalCode = data?.postal_code ?? '';
        country = data?.country ?? 'DE';
        festivalsAttended = data?.festivals_attended ?? 0;
      }
    } catch (err) {
      console.error('[account] profile load failed', err);
    } finally {
      displayNameLoaded = true;
    }
  }

  onMount(() => {
    void loadProfile();
  });

  function slugifyName(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
  }

  async function generateUniqueHandle(
    base: string,
    userId: string,
    maxTries = 8,
  ): Promise<string | null> {
    const client = auth.client;
    if (!client) return null;
    const root = base || 'energizer';
    for (let attempt = 0; attempt < maxTries; attempt++) {
      const candidate =
        attempt === 0 ? root : `${root.slice(0, 24 - String(attempt).length - 1)}_${attempt}`;
      const { data, error } = await client
        .from('profiles')
        .select('id')
        .ilike('handle', candidate)
        .neq('id', userId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.warn('[account] handle uniqueness check failed', error);
        return candidate; // best effort
      }
      if (!data) return candidate;
    }
    // Fallback: short user-id-suffix
    return `${root.slice(0, 17)}_${userId.slice(0, 6)}`;
  }

  function validateOptional(): string | null {
    if (phone && (phone.length < 5 || phone.length > 25)) {
      return m.account_phone_invalid();
    }
    if (postalCode && (postalCode.length < 3 || postalCode.length > 12)) {
      return m.account_postal_code_invalid();
    }
    if (birthdate) {
      const d = new Date(birthdate);
      if (Number.isNaN(d.getTime()) || d.getTime() >= Date.now()) {
        return m.account_birthdate_invalid();
      }
    }
    return null;
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
      const optErr = validateOptional();
      if (optErr) {
        profileError = optErr;
        return;
      }

      const trimmedName = displayName.trim();
      let nextHandle: string | null = handle || null;

      if (handleColumnAvailable && trimmedName) {
        const base = slugifyName(trimmedName);
        if (!handle || slugifyName(handle) !== base) {
          nextHandle = await generateUniqueHandle(base, user.id);
        }
      }

      const payload: {
        display_name: string | null;
        handle?: string | null;
        phone?: string | null;
        birthdate?: string | null;
        postal_code?: string | null;
        country?: string;
        festivals_attended?: number;
      } = {
        display_name: trimmedName || null,
      };
      if (handleColumnAvailable) payload.handle = nextHandle;
      if (extendedColumnsAvailable) {
        payload.phone = phone.trim() || null;
        payload.birthdate = birthdate || null;
        payload.postal_code = postalCode.trim() || null;
        payload.country = country || 'DE';
        payload.festivals_attended = Math.max(0, Math.min(6, festivalsAttended));
      }

      const { error } = await client.from('profiles').update(payload).eq('id', user.id);

      if (error) {
        if (error.code === '42703') {
          // Eine der neuen Spalten fehlt — minimal payload retry
          extendedColumnsAvailable = false;
          const minimal: { display_name: string | null; handle?: string | null } = {
            display_name: trimmedName || null,
          };
          if (handleColumnAvailable) minimal.handle = nextHandle;
          const { error: retryErr } = await client
            .from('profiles')
            .update(minimal)
            .eq('id', user.id);
          if (retryErr) {
            if (retryErr.code === '42703') {
              handleColumnAvailable = false;
              const { error: r2 } = await client
                .from('profiles')
                .update({ display_name: trimmedName || null })
                .eq('id', user.id);
              if (r2) throw r2;
            } else {
              throw retryErr;
            }
          }
        } else if (error.code === '23505' && handleColumnAvailable) {
          nextHandle = await generateUniqueHandle(
            slugifyName(trimmedName) + '_' + user.id.slice(0, 4),
            user.id,
          );
          const { error: retryErr } = await client
            .from('profiles')
            .update({ ...payload, handle: nextHandle })
            .eq('id', user.id);
          if (retryErr) throw retryErr;
        } else {
          throw error;
        }
      }

      if (nextHandle) handle = nextHandle;
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

          {#if extendedColumnsAvailable}
            <fieldset class="mt-2 border-l-4 border-accent bg-bg pl-4 py-3 space-y-4">
              <legend class="float-left -mt-1 mr-3 px-2 bg-bg">
                <span
                  class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
                >
                  {m.account_optional_section()}
                </span>
              </legend>
              <p class="clear-both text-xs text-fg-muted">
                {m.account_optional_hint()}
              </p>

              <label class="block">
                <span
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {m.account_phone_label()}
                </span>
                <input
                  type="tel"
                  bind:value={phone}
                  placeholder={m.account_phone_placeholder()}
                  disabled={!displayNameLoaded || savingProfile}
                  maxlength="25"
                  autocomplete="tel"
                  class="mt-2 w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
                />
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span
                    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {m.account_birthdate_label()}
                  </span>
                  <input
                    type="date"
                    bind:value={birthdate}
                    disabled={!displayNameLoaded || savingProfile}
                    autocomplete="bday"
                    class="mt-2 w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                </label>

                <label class="block">
                  <span
                    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {m.account_country_label()}
                  </span>
                  <select
                    bind:value={country}
                    disabled={!displayNameLoaded || savingProfile}
                    class="mt-2 w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg focus:border-accent focus:outline-none disabled:opacity-50"
                  >
                    {#each countries as c (c.code)}
                      <option value={c.code}>{c.label}</option>
                    {/each}
                  </select>
                </label>

                <label class="block">
                  <span
                    class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {m.account_postal_code_label()}
                  </span>
                  <input
                    type="text"
                    bind:value={postalCode}
                    placeholder={m.account_postal_code_placeholder()}
                    disabled={!displayNameLoaded || savingProfile}
                    maxlength="12"
                    inputmode="numeric"
                    autocomplete="postal-code"
                    class="mt-2 w-full border-2 border-border bg-surface px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                </label>
              </div>

              <!-- Festivals besucht -->
              <div>
                <span
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {m.account_festivals_label()}
                </span>
                <div class="mt-2 flex flex-wrap gap-2" role="radiogroup">
                  {#each [0, 1, 2, 3, 4, 5, 6] as n (n)}
                    <button
                      type="button"
                      onclick={() => (festivalsAttended = n)}
                      role="radio"
                      aria-checked={festivalsAttended === n}
                      disabled={!displayNameLoaded || savingProfile}
                      class="flex h-11 w-11 items-center justify-center border-2 font-display text-lg font-black transition-all active:scale-95 disabled:opacity-50"
                      class:border-accent={festivalsAttended === n}
                      class:bg-accent={festivalsAttended === n}
                      class:text-fg-inverse={festivalsAttended === n}
                      class:border-border={festivalsAttended !== n}
                      class:bg-surface={festivalsAttended !== n}
                      class:text-fg-muted={festivalsAttended !== n}
                    >
                      {n === 6 ? '6+' : n}
                    </button>
                  {/each}
                </div>
                <p class="mt-2 text-xs text-fg-muted">{m.account_festivals_hint()}</p>
              </div>
            </fieldset>
          {/if}

          {#if profileError}
            <p class="text-sm text-danger" role="alert">{profileError}</p>
          {/if}
          {#if profileSaved}
            <p class="text-sm text-success" aria-live="polite">✓ {m.account_saved()}</p>
          {/if}

          <Button type="submit" variant="yellow">
            {savingProfile ? m.account_saving() : m.account_save()}
          </Button>

          {#if handleColumnAvailable && handle}
            <p class="text-xs text-fg-muted">
              Dein Handle: <span class="font-mono text-fg">@{handle}</span> · Profil:
              <a href={`/u/${auth.user.id}`} class="font-mono text-accent hover:underline"
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
