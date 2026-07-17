<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { cart } from '$lib/modules/shop/cart.svelte';
  import { devComplete } from '$lib/modules/shop/api';

  const orderId = $derived(page.url.searchParams.get('order'));

  let status = $state<string>('pending');
  let provider = $state<string>('');
  let simulating = $state(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    void poll();
    timer = setInterval(() => void poll(), 2000);
  });
  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  async function poll() {
    if (!auth.pb || !orderId) return;
    try {
      const o = await auth.pb.collection('shop_orders').getOne(orderId);
      status = o.status as string;
      provider = (o.provider as string) ?? '';
      if (status === 'paid') {
        cart.clear();
        if (timer) clearInterval(timer);
      } else if (status === 'cancelled' || status === 'expired') {
        if (timer) clearInterval(timer);
      }
    } catch (err) {
      console.error('[return] poll failed', err);
    }
  }

  async function simulate() {
    if (!orderId) return;
    simulating = true;
    try {
      await devComplete(orderId);
      await poll();
    } catch (err) {
      console.error('[return] simulate failed', err);
    } finally {
      simulating = false;
    }
  }
</script>

<svelte:head>
  <title>Bestellung</title>
</svelte:head>

<div class="mx-auto w-full max-w-md px-5 py-14 md:py-20">
  {#if status === 'paid'}
    <div class="card p-8 text-center">
      <div class="check">✓</div>
      <h1 class="mt-4 text-2xl font-semibold tracking-tight text-fg">Danke!</h1>
      <p class="mt-2 text-fg-muted">Deine Zahlung ist eingegangen. Deine Tickets liegen bereit.</p>
      <div class="mt-6"><Button href="/account/tickets">Meine Tickets</Button></div>
    </div>
  {:else if status === 'cancelled' || status === 'expired'}
    <div class="card p-8 text-center">
      <h1 class="text-2xl font-semibold tracking-tight text-fg">Bestellung abgebrochen</h1>
      <p class="mt-2 text-fg-muted">Die Bestellung ist {status}. Bitte versuche es erneut.</p>
      <div class="mt-6"><Button href="/shop">Zurueck zum Shop</Button></div>
    </div>
  {:else}
    <div class="card p-8 text-center">
      <div class="spinner"></div>
      <h1 class="mt-5 text-2xl font-semibold tracking-tight text-fg">Zahlung wird bestaetigt …</h1>
      <p class="mt-2 text-fg-muted">Einen Moment, wir pruefen den Zahlungseingang.</p>

      {#if provider === 'stub'}
        <div
          class="mt-6 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-4 text-left"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-accent">Testmodus</p>
          <p class="mt-1.5 text-sm text-fg-muted">Kein echter Zahlungsanbieter konfiguriert.</p>
          <div class="mt-3">
            <Button onclick={simulate} disabled={simulating}
              >{simulating ? '…' : 'Zahlung simulieren'}</Button
            >
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 9999px;
    font-size: 1.5rem;
    color: #05261a;
    background-color: var(--color-success);
    box-shadow: 0 8px 24px rgba(52, 211, 153, 0.35);
  }
  .spinner {
    width: 2.25rem;
    height: 2.25rem;
    margin: 0 auto;
    border-radius: 9999px;
    border: 3px solid var(--glass-border);
    border-top-color: var(--color-accent);
    animation: spin 700ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
