<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import QrCode from '$lib/modules/shop/QrCode.svelte';

  interface Ticket {
    id: string;
    code: string;
    qr_token: string;
    status: 'valid' | 'used' | 'void';
    expand?: { ticket_type?: { name: string } };
  }

  let tickets = $state<Ticket[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

  onMount(() => void load());

  async function load() {
    if (!auth.pb || !auth.user) {
      loading = false;
      return;
    }
    try {
      const rows = await auth.pb
        .collection('shop_tickets')
        .getFullList({ expand: 'ticket_type', sort: '-created' });
      tickets = rows as unknown as Ticket[];
    } catch (err) {
      console.error('[tickets] load failed', err);
    } finally {
      loading = false;
    }
  }

  function typeName(t: Ticket): string {
    return t.expand?.ticket_type?.name ?? 'Ticket';
  }
  function statusLabel(s: Ticket['status']): string {
    return s === 'valid' ? 'Gueltig' : s === 'used' ? 'Verwendet' : 'Ungueltig';
  }
  function statusClass(s: Ticket['status']): string {
    return s === 'valid'
      ? 'border-accent text-accent'
      : s === 'used'
        ? 'border-fg-muted text-fg-muted'
        : 'border-danger text-danger';
  }
</script>

<svelte:head>
  <title>Meine Tickets — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Meine Tickets</Heading>

    {#if loading}
      <p class="mt-8 text-fg-muted">…</p>
    {:else if tickets.length === 0}
      <p class="mt-8 text-fg-muted">Du hast noch keine Tickets.</p>
      <div class="mt-6">
        <Button href="/shop" variant="yellow">Zum Ticketshop</Button>
      </div>
    {:else}
      <ul class="mt-8 space-y-6">
        {#each tickets as t (t.id)}
          <li
            class="flex flex-col items-center gap-4 border-2 border-border bg-surface p-6 sm:flex-row sm:items-center"
          >
            <div class="shrink-0">
              {#if t.status === 'valid'}
                <QrCode value={t.qr_token} size={180} />
              {:else}
                <div
                  class="flex h-[180px] w-[180px] items-center justify-center bg-bg font-mono text-xs text-fg-muted"
                >
                  {statusLabel(t.status)}
                </div>
              {/if}
            </div>
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <p
                class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {typeName(t)}
              </p>
              <p
                class="mt-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >
                {t.code}
              </p>
              <span
                class="mt-3 inline-block border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {statusClass(
                  t.status,
                )}"
              >
                {statusLabel(t.status)}
              </span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Container>
