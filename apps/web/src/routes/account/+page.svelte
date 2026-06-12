<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m, languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  const locale = $derived(languageTag() as AvailableLanguageTag);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

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

      <div class="mt-8">
        <Button variant="ghost" onclick={handleLogout}>
          {signingOut ? '…' : m.account_logout()}
        </Button>
      </div>
    {/if}
  </section>
</Container>
