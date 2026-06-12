<script lang="ts">
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
