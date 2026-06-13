<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';

  const ticketId = $derived(page.params.id);

  interface TicketRow {
    id: string;
    subject: string;
    category: string | null;
    status: 'open' | 'in_progress' | 'answered' | 'closed';
    created_at: string;
    updated_at: string;
    user_id: string;
  }
  interface MessageRow {
    id: string;
    author_id: string;
    body: string;
    is_staff: boolean;
    created_at: string;
  }

  let ticket = $state<TicketRow | null>(null);
  let messages = $state<MessageRow[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let replyBody = $state('');
  let replying = $state(false);
  let replyError = $state<string | null>(null);

  $effect(() => {
    if (!isAuthConfigured) return;
    if (auth.loading || !auth.adminChecked) return;
    if (!auth.user) {
      void goto('/login', { replaceState: true });
    }
  });

  async function load() {
    const client = auth.client;
    if (!client || !ticketId) return;
    loading = true;
    errorMsg = null;
    try {
      const { data: t, error: tErr } = await client
        .from('support_tickets')
        .select('id, subject, category, status, created_at, updated_at, user_id')
        .eq('id', ticketId)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!t) {
        errorMsg = 'Ticket nicht gefunden.';
        return;
      }
      ticket = t as TicketRow;

      const { data: m, error: mErr } = await client
        .from('support_messages')
        .select('id, author_id, body, is_staff, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (mErr) throw mErr;
      messages = (m ?? []) as MessageRow[];
    } catch (err) {
      console.error('[support/detail] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  async function reply(event: SubmitEvent) {
    event.preventDefault();
    if (replying) return;
    replyError = null;
    const body = replyBody.trim();
    if (!body) {
      replyError = m.support_error_body();
      return;
    }
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !ticket) return;
    replying = true;
    try {
      const { error } = await client.from('support_messages').insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body,
        is_staff: false,
      });
      if (error) throw error;
      replyBody = '';
      await load();
    } catch (err) {
      console.error('[support/detail] reply failed', err);
      replyError = m.support_error_generic();
    } finally {
      replying = false;
    }
  }

  onMount(() => {
    if (ticketId) void load();
  });
  $effect(() => {
    if (auth.adminChecked && ticketId) void load();
  });

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  function statusLabel(s: TicketRow['status']): string {
    if (s === 'open') return m.support_status_open();
    if (s === 'in_progress') return m.support_status_in_progress();
    if (s === 'answered') return m.support_status_answered();
    return m.support_status_closed();
  }
  function statusClass(s: TicketRow['status']): string {
    if (s === 'answered') return 'border-accent bg-accent text-fg-inverse';
    if (s === 'open') return 'border-danger text-danger';
    if (s === 'in_progress') return 'border-fg-muted text-fg';
    return 'border-border text-fg-muted';
  }
</script>

<svelte:head>
  <title>Support · ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-12 md:py-16">
    <a
      href="/account"
      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
    >
      ← {m.support_back()}
    </a>

    {#if loading}
      <p class="mt-8 text-fg-muted">…</p>
    {:else if errorMsg}
      <p class="mt-8 text-danger">{errorMsg}</p>
    {:else if ticket}
      <div class="mt-6 flex items-start justify-between gap-3">
        <h1
          class="font-display font-black uppercase leading-[0.95] tracking-[-0.02em] text-fg"
          style="font-size: clamp(1.75rem, 5vw, 3rem);"
        >
          {ticket.subject}
        </h1>
        <span
          class="shrink-0 border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {statusClass(
            ticket.status,
          )}"
        >
          {statusLabel(ticket.status)}
        </span>
      </div>
      <p
        class="mt-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        Erstellt {fmtDate(ticket.created_at)}
      </p>

      <!-- Verlauf -->
      <ul class="mt-8 space-y-3">
        {#each messages as msg (msg.id)}
          <li>
            <article
              class="border-2 p-4"
              class:border-accent={msg.is_staff}
              class:bg-surface={!msg.is_staff}
              class:bg-bg={msg.is_staff}
            >
              <div class="flex items-baseline justify-between gap-2">
                <p
                  class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                  class:text-accent={msg.is_staff}
                  class:text-fg-muted={!msg.is_staff}
                >
                  {msg.is_staff ? `⚡ ${m.support_staff()}` : m.support_you()}
                </p>
                <p
                  class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {fmtDate(msg.created_at)}
                </p>
              </div>
              <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg">
                {msg.body}
              </p>
            </article>
          </li>
        {/each}
      </ul>

      <!-- Antwort-Form (nur wenn nicht closed) -->
      {#if ticket.status !== 'closed'}
        <form onsubmit={reply} class="mt-8 border-2 border-border bg-surface p-5 space-y-4">
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              {m.support_reply_label()}
            </span>
            <textarea
              bind:value={replyBody}
              rows="4"
              maxlength="4000"
              disabled={replying}
              class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
            ></textarea>
          </label>
          {#if replyError}
            <p class="text-sm text-danger" role="alert">{replyError}</p>
          {/if}
          <Button type="submit" variant="yellow">
            {replying ? m.support_replying() : m.support_reply()}
          </Button>
        </form>
      {:else}
        <p class="mt-8 border-l-4 border-fg-muted bg-surface p-4 text-sm text-fg-muted">
          {m.support_closed_hint()}
        </p>
      {/if}
    {/if}
  </section>
</Container>
