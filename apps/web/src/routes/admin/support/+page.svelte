<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  interface OpenTicket {
    id: string;
    subject: string;
    category: string | null;
    status: 'open' | 'in_progress' | 'answered' | 'closed';
    created_at: string;
    updated_at: string;
    last_admin_reply_at: string | null;
    user_id: string;
    user_email: string;
    user_display_name: string | null;
    message_count: number;
    unanswered_age_hours: number;
  }

  let items = $state<OpenTicket[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let filter = $state<'all' | 'open' | 'in_progress' | 'answered'>('open');

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    errorMsg = null;
    try {
      const { data, error } = await client.rpc('admin_list_open_tickets');
      if (error) throw error;
      items = (data ?? []) as OpenTicket[];
    } catch (err) {
      console.error('[admin/support] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });
  $effect(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  const filtered = $derived(filter === 'all' ? items : items.filter((t) => t.status === filter));

  function fmtAge(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${Math.round(hours)} h`;
    return `${Math.round(hours / 24)} d`;
  }
  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  function statusClass(s: OpenTicket['status']): string {
    if (s === 'answered') return 'border-accent bg-accent text-fg-inverse';
    if (s === 'open') return 'border-danger text-danger';
    if (s === 'in_progress') return 'border-fg-muted text-fg';
    return 'border-border text-fg-muted';
  }
  function ageClass(hours: number): string {
    if (hours > 72) return 'text-danger';
    if (hours > 24) return 'text-accent';
    return 'text-fg-muted';
  }

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'open', label: 'Offen' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'answered', label: 'Beantwortet' },
    { value: 'all', label: 'Alle (offen)' },
  ];
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">Inbox</p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      Support
    </h1>

    <ul class="mt-8 flex flex-wrap gap-2">
      {#each filters as f (f.value)}
        <li>
          <button
            type="button"
            onclick={() => (filter = f.value)}
            class="border-2 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] transition-colors"
            class:border-accent={filter === f.value}
            class:bg-accent={filter === f.value}
            class:text-fg-inverse={filter === f.value}
            class:border-border={filter !== f.value}
            class:text-fg-muted={filter !== f.value}
          >
            {f.label}
          </button>
        </li>
      {/each}
    </ul>

    {#if loading}
      <p class="mt-10 text-fg-muted">…</p>
    {:else if errorMsg}
      <div class="mt-10 border-2 border-danger bg-surface p-5">
        <p class="font-mono text-xs text-danger">{errorMsg}</p>
        <p class="mt-2 text-sm text-fg">
          Vermutlich fehlt Migration 0010_support_tickets im Supabase-Editor.
        </p>
      </div>
    {:else if filtered.length === 0}
      <div class="mt-10 border-l-4 border-success bg-surface p-5">
        <p
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-success"
        >
          Inbox sauber.
        </p>
        <p class="mt-2 text-sm text-fg-muted">Keine offenen Tickets in dieser Ansicht.</p>
      </div>
    {:else}
      <ul class="mt-8 divide-y divide-border border-y-2 border-border">
        {#each filtered as ticket (ticket.id)}
          <li>
            <a
              href={`/admin/support/${ticket.id}`}
              class="grid grid-cols-[1fr_auto] gap-3 py-4 transition-colors hover:bg-surface sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <div class="min-w-0">
                <p
                  class="font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg"
                >
                  {ticket.subject}
                </p>
                <p
                  class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  {ticket.user_display_name ?? ticket.user_email}
                  · {fmtDate(ticket.updated_at)}
                  · {ticket.message_count} msg
                  {#if ticket.category}
                    · {ticket.category}
                  {/if}
                </p>
              </div>
              <span
                class="self-start border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {statusClass(
                  ticket.status,
                )}"
              >
                {ticket.status}
              </span>
              <span
                class="self-start font-mono text-xs {ageClass(ticket.unanswered_age_hours)}"
                title="Wartet seit"
              >
                ⏱ {fmtAge(ticket.unanswered_age_hours)}
              </span>
              <span class="self-start font-mono text-xs text-fg-muted">→</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Hinweis: Instagram / Facebook -->
    <div class="mt-12 border-2 border-border bg-surface p-5">
      <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent">
        Coming Soon
      </p>
      <h2
        class="mt-2 font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
      >
        Instagram und Facebook im selben Postfach
      </h2>
      <p class="mt-2 text-sm text-fg-muted">
        Hier landen später auch DMs von <strong class="text-fg">@energize_offical</strong>
        (Instagram) und der Facebook-Seite. Voraussetzung: Meta-Business-Account und Verknüpfung via Graph
        API. Vor Festival 2027 aufsetzen.
      </p>
    </div>
  </section>
</Container>
