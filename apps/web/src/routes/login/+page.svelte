<script lang="ts">
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@energize/ui';
  import { m, languageTag, type AvailableLanguageTag } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  let email = $state('');
  let submitting = $state(false);
  let sent = $state(false);
  let errorMsg = $state<string | null>(null);

  const locale = $derived(languageTag() as AvailableLanguageTag);

  // Erst nach Auth-Resolution redirecten — sonst rendert die Form
  // fuer ~50-300ms bevor wir feststellen dass der User schon
  // eingeloggt ist.
  $effect(() => {
    if (!auth.loading && auth.user) {
      void goto('/account', { replaceState: true });
    }
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;

    if (!emailRegex.test(email)) {
      errorMsg = m.login_error_invalid_email();
      return;
    }

    submitting = true;
    try {
      await auth.signInWithMagicLink(email, locale);
      sent = true;
    } catch (err) {
      console.error('[login] signInWithMagicLink failed', err);
      errorMsg = m.login_error_generic();
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{m.login_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>{m.login_title()}</Heading>

    {#if !isAuthConfigured}
      <div class="mt-8 border-2 border-border bg-surface p-6">
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
        >
          {m.login_not_configured_title()}
        </h2>
        <p class="mt-3 text-sm text-fg-muted">{m.login_not_configured_body()}</p>
      </div>
    {:else if sent}
      <div class="mt-8 border-2 border-accent bg-surface p-6">
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {m.login_sent_title()}
        </h2>
        <p class="mt-3 text-sm text-fg-muted">{m.login_sent_body()}</p>
        <p class="mt-3 border-l-2 border-accent pl-3 text-sm text-fg">
          ⚠ {m.community_login_step_3_body()}
        </p>
      </div>
    {:else}
      <p class="mt-6 text-fg-muted">{m.login_lead()}</p>

      <form onsubmit={handleSubmit} class="mt-8 space-y-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.login_email_label()}
          </span>
          <input
            type="email"
            required
            autocomplete="email"
            bind:value={email}
            placeholder={m.login_email_placeholder()}
            disabled={submitting}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>

        {#if errorMsg}
          <p class="text-sm text-danger" role="alert">{errorMsg}</p>
        {/if}

        <Button type="submit" variant="yellow">
          {submitting ? m.login_submitting() : m.login_submit()}
        </Button>
      </form>

      <p
        class="mt-12 border-t border-border pt-6 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        <a href="/community" class="hover:text-accent transition-colors">
          → {m.community_login_help()}
        </a>
      </p>
    {/if}
  </section>
</Container>
