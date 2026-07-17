<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Heading, Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { cart } from '$lib/modules/shop/cart.svelte';
  import { formatPrice } from '$lib/modules/shop/api';

  interface TicketType {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    per_order_limit: number;
    sold: number;
    reserved: number;
    quota: number;
  }

  let types = $state<TicketType[]>([]);
  let loading = $state(true);

  onMount(() => {
    cart.load();
    void load();
  });

  async function load() {
    if (!auth.pb) {
      loading = false;
      return;
    }
    try {
      const rows = await auth.pb
        .collection('shop_ticket_types')
        .getFullList({ filter: 'active=true', sort: 'sort' });
      types = rows as unknown as TicketType[];
    } catch (err) {
      console.error('[shop] load failed', err);
    } finally {
      loading = false;
    }
  }

  function available(t: TicketType): number {
    return (t.quota || 0) - (t.sold || 0) - (t.reserved || 0);
  }
</script>

<svelte:head>
  <title>Ticketshop — ENERGIZE</title>
</svelte:head>

<Container>
  <section class="py-16 md:py-24">
    <Heading level={1} display>Ticketshop</Heading>
    <p class="mt-4 max-w-2xl text-fg-muted">Waehle deine Tickets. Bezahlung sicher im Checkout.</p>

    {#if loading}
      <p class="mt-10 text-fg-muted">…</p>
    {:else if types.length === 0}
      <p class="mt-10 text-fg-muted">Aktuell sind keine Tickets im Verkauf.</p>
    {:else}
      <ul class="mt-10 grid gap-4 md:grid-cols-2">
        {#each types as t (t.id)}
          {@const soldOut = available(t) <= 0}
          <li class="flex flex-col border-2 border-border bg-surface p-6">
            <div class="flex items-start justify-between gap-4">
              <h2
                class="font-display text-2xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {t.name}
              </h2>
              <span class="shrink-0 font-mono text-lg text-accent"
                >{formatPrice(t.price, t.currency)}</span
              >
            </div>
            {#if t.description}
              <p class="mt-2 text-sm text-fg-muted">{t.description}</p>
            {/if}
            <div class="mt-6 flex items-center justify-between gap-3">
              {#if soldOut}
                <span
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-danger"
                >
                  Ausverkauft
                </span>
              {:else}
                <Button
                  variant="yellow"
                  onclick={() => cart.add({ ticketType: t.id, name: t.name, price: t.price })}
                >
                  + In den Warenkorb
                </Button>
              {/if}
            </div>
          </li>
        {/each}
      </ul>

      {#if cart.count > 0}
        <div
          class="mt-10 flex flex-wrap items-center justify-between gap-4 border-2 border-accent bg-bg p-5"
        >
          <p class="font-mono text-sm text-fg">
            {cart.count} Ticket(s) · <span class="text-accent">{formatPrice(cart.total)}</span>
          </p>
          <Button href="/shop/checkout" variant="yellow">Zur Kasse →</Button>
        </div>
      {/if}
    {/if}
  </section>
</Container>
