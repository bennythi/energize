<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  let pendingCount = $state<number | null>(null);
  let approvedCount = $state<number | null>(null);
  let rejectedCount = $state<number | null>(null);
  let reportsCount = $state<number | null>(null);
  let feedbackCount = $state<number | null>(null);
  let usersCount = $state<number | null>(null);
  let openTicketsCount = $state<number | null>(null);

  async function loadStats() {
    const client = auth.client;
    if (!client) return;
    const [pending, approved, rejected, reports, feedback, users, tickets] = await Promise.all([
      client.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      client.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      client.from('reports').select('id', { count: 'exact', head: true }),
      client.from('feedback').select('id', { count: 'exact', head: true }),
      client.from('profiles_public').select('id', { count: 'exact', head: true }),
      client
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'closed'),
    ]);
    pendingCount = pending.count ?? 0;
    approvedCount = approved.count ?? 0;
    rejectedCount = rejected.count ?? 0;
    reportsCount = reports.count ?? 0;
    feedbackCount = feedback.count ?? 0;
    usersCount = users.count ?? 0;
    openTicketsCount = tickets.error ? 0 : (tickets.count ?? 0);
  }

  onMount(() => {
    void loadStats();
  });

  interface Tile {
    label: string;
    value: number | null;
    href: string;
    accent?: boolean;
  }

  const tiles = $derived<Tile[]>([
    {
      label: 'Support offen',
      value: openTicketsCount,
      href: '/admin/support',
      accent: (openTicketsCount ?? 0) > 0,
    },
    {
      label: 'Pending Posts',
      value: pendingCount,
      href: '/admin/moderation',
      accent: (pendingCount ?? 0) > 0,
    },
    {
      label: 'Reports offen',
      value: reportsCount,
      href: '/admin/reports',
      accent: (reportsCount ?? 0) > 0,
    },
    { label: 'Feedback', value: feedbackCount, href: '/admin/feedback' },
    { label: 'User-Profile', value: usersCount, href: '/admin/users' },
    { label: 'Crew verwalten', value: null, href: '/admin/crew' },
    { label: 'Berechtigungen', value: null, href: '/admin/berechtigungen' },
    { label: 'Briefings', value: null, href: '/admin/briefings' },
    { label: 'Meilensteine', value: null, href: '/admin/meilensteine' },
    { label: 'Cashless-Kassen', value: null, href: '/admin/cashless-kassen' },
    { label: 'Approved Posts', value: approvedCount, href: '/wall' },
    { label: 'Rejected Posts', value: rejectedCount, href: '/admin/moderation' },
    { label: 'Externe Tools', value: 6, href: '/admin/tools' },
  ]);
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      Dashboard
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 6vw, 3.5rem);"
    >
      Energize <span class="text-accent">/</span> Admin
    </h1>

    <ul class="stagger-list mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {#each tiles as tile (tile.label)}
        <li>
          <a
            href={tile.href}
            class="card-press relative flex h-full flex-col justify-between border-2 p-5 transition-all"
            class:border-accent={tile.accent}
            class:bg-surface={!tile.accent}
            class:border-border={!tile.accent}
            class:hover:border-accent={!tile.accent}
          >
            <p
              class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              {tile.label}
            </p>
            <p
              class="mt-4 font-display font-black tabular-nums leading-none text-fg"
              class:text-accent={tile.accent}
              style="font-size: clamp(2.5rem, 5vw, 4rem);"
            >
              {tile.value ?? '…'}
            </p>
          </a>
        </li>
      {/each}
    </ul>

    <div class="mt-12 border-l-4 border-accent bg-surface p-5">
      <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent">
        Wie wird man Admin?
      </p>
      <p class="mt-2 text-sm text-fg">Im Supabase SQL-Editor:</p>
      <pre
        class="mt-2 overflow-x-auto border border-border bg-bg p-3 font-mono text-xs text-fg-muted">update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'deine@email.de');</pre>
    </div>
  </section>
</Container>
