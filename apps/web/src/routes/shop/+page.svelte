<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@platform/ui';
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
  function inCart(id: string): number {
    return cart.items.find((i) => i.ticketType === id)?.qty ?? 0;
  }
</script>

<svelte:head>
  <title>Ticketshop</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl px-5 py-10 md:py-16">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Ticketshop</h1>
  <p class="mt-3 max-w-xl text-fg-muted">Waehle deine Tickets. Sichere Bezahlung im Checkout.</p>

  {#if loading}
    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      {#each Array(2) as _, i (i)}
        <div class="card h-40 animate-pulse opacity-50"></div>
      {/each}
    </div>
  {:else if types.length === 0}
    <p class="mt-10 text-fg-muted">Aktuell sind keine Tickets im Verkauf.</p>
  {:else}
    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      {#each types as t (t.id)}
        {@const soldOut = available(t) <= 0}
        {@const qty = inCart(t.id)}
        <article class="card flex flex-col gap-5 p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold tracking-tight text-fg">{t.name}</h2>
              {#if t.description}
                <p class="mt-1.5 text-sm text-fg-muted">{t.description}</p>
              {/if}
            </div>
            <span class="shrink-0 text-lg font-semibold text-accent"
              >{formatPrice(t.price, t.currency)}</span
            >
          </div>

          <div class="mt-auto">
            {#if soldOut}
              <span class="text-sm font-medium text-danger">Ausverkauft</span>
            {:else if qty > 0}
              <div class="flex items-center gap-3">
                <div class="stepper">
                  <button
                    type="button"
                    aria-label="weniger"
                    onclick={() => cart.setQty(t.id, qty - 1)}>−</button
                  >
                  <span>{qty}</span>
                  <button
                    type="button"
                    aria-label="mehr"
                    onclick={() => cart.setQty(t.id, Math.min(qty + 1, t.per_order_limit || 10))}
                    >+</button
                  >
                </div>
                <span class="text-xs text-fg-muted">im Warenkorb</span>
              </div>
            {:else}
              <Button
                variant="ghost"
                onclick={() => cart.add({ ticketType: t.id, name: t.name, price: t.price })}
              >
                In den Warenkorb
              </Button>
            {/if}
          </div>
        </article>
      {/each}
    </div>

    {#if cart.count > 0}
      <div class="cart-bar card">
        <p class="text-sm text-fg">
          <span class="font-semibold">{cart.count}</span> Ticket(s) ·
          <span class="font-semibold text-accent">{formatPrice(cart.total)}</span>
        </p>
        <Button href="/shop/checkout">Zur Kasse</Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .stepper button {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    color: var(--color-fg);
    font-size: 1.1rem;
    line-height: 1;
    transition: background-color var(--dur-hover) var(--ease-out);
  }
  .stepper button:hover {
    background-color: var(--glass-bg-strong);
  }
  .stepper span {
    min-width: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    color: var(--color-fg);
  }

  .cart-bar {
    position: sticky;
    bottom: 1rem;
    margin-top: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: var(--radius-pill);
  }
</style>
