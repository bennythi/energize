<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Heading, Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { cart } from '$lib/modules/shop/cart.svelte';
  import { checkout, formatPrice } from '$lib/modules/shop/api';

  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  onMount(() => cart.load());

  async function pay() {
    errorMsg = null;
    if (!auth.user) {
      void goto('/login');
      return;
    }
    if (cart.count === 0) return;
    submitting = true;
    try {
      const items = cart.items.map((i) => ({ ticket_type: i.ticketType, qty: i.qty }));
      const res = await checkout(items);
      // Weiterleitung zur Hosted-Checkout-URL (im Stub-Modus die Return-Seite).
      window.location.href = res.checkout_url;
    } catch (err) {
      console.error('[checkout] failed', err);
      errorMsg = 'Checkout fehlgeschlagen. Bitte erneut versuchen.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Kasse — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Kasse</Heading>

    {#if cart.count === 0}
      <p class="mt-8 text-fg-muted">Dein Warenkorb ist leer.</p>
      <div class="mt-6">
        <Button href="/shop" variant="yellow">Zum Ticketshop</Button>
      </div>
    {:else}
      <ul class="mt-8 divide-y divide-border border-y border-border">
        {#each cart.items as item (item.ticketType)}
          <li class="flex items-center justify-between gap-4 py-4">
            <div class="min-w-0 flex-1">
              <p
                class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {item.name}
              </p>
              <p class="mt-1 font-mono text-xs text-fg-muted">
                {formatPrice(item.price)} · Stueck
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => cart.setQty(item.ticketType, item.qty - 1)}
                class="h-8 w-8 border-2 border-border text-fg hover:border-accent"
                aria-label="weniger">−</button
              >
              <span class="w-8 text-center font-mono text-fg">{item.qty}</span>
              <button
                type="button"
                onclick={() => cart.setQty(item.ticketType, item.qty + 1)}
                class="h-8 w-8 border-2 border-border text-fg hover:border-accent"
                aria-label="mehr">+</button
              >
            </div>
          </li>
        {/each}
      </ul>

      <div class="mt-6 flex items-center justify-between border-b-2 border-accent pb-4">
        <span class="font-mono text-sm uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >Gesamt</span
        >
        <span class="font-display text-2xl font-black text-accent">{formatPrice(cart.total)}</span>
      </div>

      {#if !auth.user}
        <p class="mt-6 text-sm text-fg-muted">
          Zum Kaufen bitte <a href="/login" class="text-accent hover:underline">einloggen</a>.
        </p>
      {/if}
      {#if errorMsg}
        <p class="mt-6 text-sm text-danger" role="alert">{errorMsg}</p>
      {/if}

      <div class="mt-8 flex flex-wrap gap-3">
        <Button variant="yellow" onclick={pay} disabled={submitting}>
          {submitting ? 'Weiterleitung …' : 'Kostenpflichtig bestellen'}
        </Button>
        <Button variant="ghost" href="/shop">Weiter shoppen</Button>
      </div>
    {/if}
  </section>
</Container>
