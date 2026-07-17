<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { Container, Heading, Button } from '@platform/ui';
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

  // Stub-Modus: Zahlung lokal simulieren (ohne Mollie/Stripe).
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
  <title>Bestellung — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    {#if status === 'paid'}
      <Heading level={1} display>Danke!</Heading>
      <p class="mt-6 text-fg-muted">
        Deine Zahlung ist eingegangen. Deine Tickets liegen in deinem Account bereit.
      </p>
      <div class="mt-8">
        <Button href="/account/tickets" variant="yellow">Meine Tickets →</Button>
      </div>
    {:else if status === 'cancelled' || status === 'expired'}
      <Heading level={1} display>Bestellung abgebrochen</Heading>
      <p class="mt-6 text-fg-muted">Die Bestellung ist {status}. Bitte versuche es erneut.</p>
      <div class="mt-8">
        <Button href="/shop" variant="yellow">Zurueck zum Shop</Button>
      </div>
    {:else}
      <Heading level={1} display>Zahlung wird bestaetigt …</Heading>
      <p class="mt-6 text-fg-muted">Einen Moment, wir pruefen den Zahlungseingang.</p>

      {#if provider === 'stub'}
        <div class="mt-8 border-2 border-accent bg-surface p-5">
          <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
            Testmodus
          </p>
          <p class="mt-2 text-sm text-fg-muted">
            Kein echter Zahlungsanbieter konfiguriert. Zahlung simulieren:
          </p>
          <div class="mt-4">
            <Button variant="yellow" onclick={simulate} disabled={simulating}>
              {simulating ? '…' : 'Zahlung simulieren'}
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</Container>
