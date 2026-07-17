<script lang="ts">
  import { Container, Heading, Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { scanTicket, type ScanResponse } from '$lib/modules/shop/api';

  let token = $state('');
  let gate = $state('');
  let scanning = $state(false);
  let result = $state<ScanResponse | null>(null);

  async function doScan(event: SubmitEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    scanning = true;
    result = null;
    try {
      result = await scanTicket(token.trim(), gate.trim() || undefined);
    } catch (err) {
      console.error('[scan] failed', err);
      result = { result: 'invalid', reason: 'error' };
    } finally {
      scanning = false;
      token = '';
    }
  }

  function resultClass(r: ScanResponse['result']): string {
    return r === 'valid'
      ? 'border-success bg-success text-fg-inverse'
      : r === 'already_used'
        ? 'border-warn bg-warn text-fg-inverse'
        : 'border-danger bg-danger text-fg';
  }
  function resultLabel(r: ScanResponse['result']): string {
    return r === 'valid' ? 'GUELTIG' : r === 'already_used' ? 'BEREITS VERWENDET' : 'UNGUELTIG';
  }
</script>

<svelte:head>
  <title>Einlass-Scan — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-24">
    <Heading level={1} display>Einlass-Scan</Heading>

    {#if !auth.isCrew}
      <p class="mt-8 border-l-4 border-danger bg-surface p-4 text-sm text-fg-muted">
        Dieser Bereich ist nur fuer Crew mit Scan-Berechtigung.
      </p>
    {:else}
      <p class="mt-4 text-sm text-fg-muted">
        QR-Token einlesen oder einfuegen. Kamera-Scan folgt als naechster Schritt.
      </p>

      {#if result}
        <div class="mt-6 border-2 p-6 text-center {resultClass(result.result)}">
          <p class="font-display text-3xl font-black uppercase tracking-[var(--tracking-claim)]">
            {resultLabel(result.result)}
          </p>
          {#if result.result === 'valid'}
            <p class="mt-2 font-mono text-sm">{result.ticket_type}</p>
          {:else if result.result === 'already_used'}
            <p class="mt-2 font-mono text-xs">Verwendet: {result.used_at}</p>
          {/if}
        </div>
      {/if}

      <form onsubmit={doScan} class="mt-6 space-y-4">
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >QR-Token</span
          >
          <input
            type="text"
            bind:value={token}
            placeholder="1.xxxxxxxx.xxxx…"
            disabled={scanning}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >Eingang (optional)</span
          >
          <input
            type="text"
            bind:value={gate}
            placeholder="z.B. nord"
            disabled={scanning}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>
        <Button type="submit" variant="yellow" disabled={scanning}>
          {scanning ? '…' : 'Scannen'}
        </Button>
      </form>
    {/if}
  </section>
</Container>
