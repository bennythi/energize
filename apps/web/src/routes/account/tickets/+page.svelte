<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
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
    return s === 'valid' ? 'text-success' : s === 'used' ? 'text-fg-muted' : 'text-danger';
  }
</script>

<svelte:head>
  <title>Meine Tickets</title>
</svelte:head>

<div class="mx-auto w-full max-w-xl px-5 py-10 md:py-16">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Meine Tickets</h1>

  {#if loading}
    <div class="card mt-8 h-56 animate-pulse opacity-50"></div>
  {:else if tickets.length === 0}
    <div class="card mt-8 p-6">
      <p class="text-fg-muted">Du hast noch keine Tickets.</p>
      <div class="mt-5"><Button href="/shop">Zum Ticketshop</Button></div>
    </div>
  {:else}
    <div class="mt-8 flex flex-col gap-5">
      {#each tickets as t (t.id)}
        <article class="card flex flex-col items-center gap-5 p-6 sm:flex-row">
          <div class="shrink-0 rounded-2xl bg-white p-3">
            {#if t.status === 'valid'}
              <QrCode value={t.qr_token} size={168} />
            {:else}
              <div
                class="flex h-[168px] w-[168px] items-center justify-center text-xs text-[color:#666]"
              >
                {statusLabel(t.status)}
              </div>
            {/if}
          </div>
          <div class="min-w-0 flex-1 text-center sm:text-left">
            <p class="text-xl font-semibold tracking-tight text-fg">{typeName(t)}</p>
            <p class="mt-1 font-mono text-[11px] text-fg-muted">{t.code}</p>
            <p class="mt-3 text-sm font-medium {statusClass(t.status)}">
              ● {statusLabel(t.status)}
            </p>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>
