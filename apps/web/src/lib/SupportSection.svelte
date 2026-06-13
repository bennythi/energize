<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth } from '$lib/auth.svelte';

  interface TicketRow {
    id: string;
    subject: string;
    category: string | null;
    status: 'open' | 'in_progress' | 'answered' | 'closed';
    created_at: string;
    updated_at: string;
  }

  let tickets = $state<TicketRow[]>([]);
  let loading = $state(true);
  let schemaAvailable = $state(true);

  let showForm = $state(false);
  let newSubject = $state('');
  let newBody = $state('');
  let newCategory = $state<string>('other');
  let createError = $state<string | null>(null);
  let submitting = $state(false);

  const categories = [
    { value: 'account', label: m.support_category_account() },
    { value: 'ticket', label: m.support_category_ticket() },
    { value: 'cashless', label: m.support_category_cashless() },
    { value: 'wall', label: m.support_category_wall() },
    { value: 'tech', label: m.support_category_tech() },
    { value: 'other', label: m.support_category_other() },
  ];

  async function load() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) {
      loading = false;
      return;
    }
    try {
      const { data, error } = await client
        .from('support_tickets')
        .select('id, subject, category, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) {
        if (error.code === '42P01') {
          // Tabelle gibt's noch nicht → Migration 0010 fehlt
          schemaAvailable = false;
        } else {
          throw error;
        }
      } else {
        tickets = (data ?? []) as TicketRow[];
      }
    } catch (err) {
      console.error('[support] load failed', err);
    } finally {
      loading = false;
    }
  }

  async function createTicket(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    createError = null;

    const subject = newSubject.trim();
    if (subject.length < 3) {
      createError = m.support_error_subject();
      return;
    }
    const body = newBody.trim();
    if (!body) {
      createError = m.support_error_body();
      return;
    }

    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;

    submitting = true;
    try {
      const { data: ticket, error: tErr } = await client
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          category: newCategory as 'account' | 'ticket' | 'cashless' | 'wall' | 'tech' | 'other',
        })
        .select('id')
        .single();
      if (tErr) throw tErr;

      const { error: mErr } = await client.from('support_messages').insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body,
        is_staff: false,
      });
      if (mErr) throw mErr;

      newSubject = '';
      newBody = '';
      newCategory = 'other';
      showForm = false;
      await load();
    } catch (err) {
      console.error('[support] create failed', err);
      createError = m.support_error_generic();
    } finally {
      submitting = false;
    }
  }

  onMount(() => {
    void load();
  });

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

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function categoryLabel(cat: string | null): string {
    const found = categories.find((c) => c.value === cat);
    return found?.label ?? '';
  }
</script>

<section class="mt-12">
  <div class="flex items-center justify-between gap-3">
    <h2
      class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-accent"
    >
      {m.support_section_title()}
    </h2>
    {#if schemaAvailable && !showForm}
      <Button onclick={() => (showForm = true)} variant="yellow">
        + {m.support_new_cta()}
      </Button>
    {/if}
  </div>
  <p class="mt-2 max-w-xl text-sm text-fg-muted">{m.support_section_lead()}</p>

  {#if !schemaAvailable}
    <div class="mt-4 border-l-4 border-fg-muted bg-surface p-4">
      <p class="font-mono text-xs text-fg-muted">
        Support-System noch nicht eingerichtet. Migration 0010 im Supabase-Dashboard fehlt.
      </p>
    </div>
  {:else if showForm}
    <form onsubmit={createTicket} class="mt-6 border-2 border-accent bg-surface p-5 space-y-4">
      <label class="block">
        <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          {m.support_subject_label()}
        </span>
        <input
          type="text"
          bind:value={newSubject}
          placeholder={m.support_subject_placeholder()}
          maxlength="120"
          disabled={submitting}
          class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
        />
      </label>

      <label class="block">
        <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          {m.support_category_label()}
        </span>
        <select
          bind:value={newCategory}
          disabled={submitting}
          class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg focus:border-accent focus:outline-none disabled:opacity-50"
        >
          {#each categories as c (c.value)}
            <option value={c.value}>{c.label}</option>
          {/each}
        </select>
      </label>

      <label class="block">
        <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
          {m.support_body_label()}
        </span>
        <textarea
          bind:value={newBody}
          placeholder={m.support_body_placeholder()}
          rows="6"
          maxlength="4000"
          disabled={submitting}
          class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
        ></textarea>
      </label>

      {#if createError}
        <p class="text-sm text-danger" role="alert">{createError}</p>
      {/if}

      <div class="flex flex-wrap gap-2">
        <Button type="submit" variant="yellow">
          {submitting ? m.support_creating() : m.support_create()}
        </Button>
        <Button
          variant="ghost"
          onclick={() => {
            showForm = false;
            createError = null;
          }}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  {/if}

  {#if loading}
    <p class="mt-6 text-sm text-fg-muted">…</p>
  {:else if tickets.length === 0 && !showForm && schemaAvailable}
    <p class="mt-6 text-sm text-fg-muted">{m.support_no_tickets()}</p>
  {:else if tickets.length > 0}
    <ul class="mt-6 divide-y divide-border border-y border-border">
      {#each tickets as ticket (ticket.id)}
        <li>
          <a
            href={`/account/support/${ticket.id}`}
            class="flex items-center justify-between gap-3 py-4 transition-colors hover:bg-surface"
          >
            <div class="min-w-0 flex-1">
              <p
                class="font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {ticket.subject}
              </p>
              <p
                class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {fmtDate(ticket.updated_at)}
                {#if ticket.category}
                  · {categoryLabel(ticket.category)}
                {/if}
              </p>
            </div>
            <span
              class="shrink-0 border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {statusClass(
                ticket.status,
              )}"
            >
              {statusLabel(ticket.status)}
            </span>
            <span class="shrink-0 font-mono text-xs text-fg-muted">→</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
