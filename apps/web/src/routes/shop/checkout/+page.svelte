<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@platform/ui';
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
      window.location.href = res.checkout_url;
    } catch (err) {
      console.error('[checkout] failed', err);
      errorMsg = 'Checkout fehlgeschlagen. Bitte erneut versuchen.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Kasse</title>
</svelte:head>

<div class="mx-auto w-full max-w-xl px-5 py-10 md:py-16">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Kasse</h1>

  {#if cart.count === 0}
    <div class="card mt-8 p-6">
      <p class="text-fg-muted">Dein Warenkorb ist leer.</p>
      <div class="mt-5"><Button href="/shop">Zum Ticketshop</Button></div>
    </div>
  {:else}
    <div class="card mt-8 p-6">
      <ul class="flex flex-col divide-y divide-[color:var(--glass-border)]">
        {#each cart.items as item (item.ticketType)}
          <li class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div class="min-w-0">
              <p class="font-medium text-fg">{item.name}</p>
              <p class="mt-0.5 text-sm text-fg-muted">{formatPrice(item.price)} pro Stueck</p>
            </div>
            <div class="stepper">
              <button
                type="button"
                aria-label="weniger"
                onclick={() => cart.setQty(item.ticketType, item.qty - 1)}>−</button
              >
              <span>{item.qty}</span>
              <button
                type="button"
                aria-label="mehr"
                onclick={() => cart.setQty(item.ticketType, item.qty + 1)}>+</button
              >
            </div>
          </li>
        {/each}
      </ul>

      <div
        class="mt-5 flex items-center justify-between border-t border-[color:var(--glass-border)] pt-5"
      >
        <span class="text-sm text-fg-muted">Gesamt</span>
        <span class="text-2xl font-semibold text-accent">{formatPrice(cart.total)}</span>
      </div>
    </div>

    {#if !auth.user}
      <p class="mt-5 text-sm text-fg-muted">
        Zum Kaufen bitte <a href="/login" class="text-accent hover:underline">anmelden</a>.
      </p>
    {/if}
    {#if errorMsg}
      <p class="mt-5 text-sm text-danger" role="alert">{errorMsg}</p>
    {/if}

    <div class="mt-7 flex flex-wrap gap-3">
      <Button onclick={pay} disabled={submitting}>
        {submitting ? 'Weiterleitung …' : 'Kostenpflichtig bestellen'}
      </Button>
      <Button variant="ghost" href="/shop">Weiter shoppen</Button>
    </div>
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
</style>
