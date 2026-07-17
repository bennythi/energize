<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Container, Heading, Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { scanTicket, type ScanResponse } from '$lib/modules/shop/api';
  import Scanner from '$lib/modules/shop/Scanner.svelte';

  let mode = $state<'camera' | 'manual'>('camera');
  let gate = $state('');
  let token = $state('');
  let processing = $state(false);
  let result = $state<ScanResponse | null>(null);
  let resultTimer: ReturnType<typeof setTimeout> | undefined;

  // Kamera pausiert die Erkennung, solange ein Ergebnis angezeigt wird.
  const paused = $derived(processing || result !== null);

  async function handleToken(raw: string) {
    const t = raw.trim();
    if (!t || processing) return;
    processing = true;
    if (resultTimer) clearTimeout(resultTimer);
    try {
      result = await scanTicket(t, gate.trim() || undefined);
    } catch (err) {
      console.error('[scan] failed', err);
      // Netz-/Serverfehler ist NICHT dasselbe wie ein Fake-Ticket.
      result = { result: 'error', reason: err instanceof Error ? err.message : 'network' };
    } finally {
      processing = false;
      // Ergebnis kurz zeigen, dann fuer den naechsten Scan freigeben.
      resultTimer = setTimeout(() => (result = null), 2800);
    }
  }

  async function submitManual(event: SubmitEvent) {
    event.preventDefault();
    await handleToken(token);
    token = '';
  }

  onDestroy(() => {
    if (resultTimer) clearTimeout(resultTimer);
  });

  function resultClass(r: ScanResponse['result']): string {
    return r === 'valid'
      ? 'border-success bg-success text-fg-inverse'
      : r === 'already_used'
        ? 'border-warn bg-warn text-fg-inverse'
        : r === 'error'
          ? 'border-border bg-surface text-fg'
          : 'border-danger bg-danger text-fg';
  }
  function resultLabel(r: ScanResponse['result']): string {
    return r === 'valid'
      ? 'GUELTIG'
      : r === 'already_used'
        ? 'BEREITS VERWENDET'
        : r === 'error'
          ? 'FEHLER: ERNEUT SCANNEN'
          : 'UNGUELTIG';
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
      <!-- Eingang + Modus -->
      <div class="mt-6 flex flex-wrap items-end justify-between gap-4">
        <label class="block flex-1">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >Eingang (optional)</span
          >
          <input
            type="text"
            bind:value={gate}
            placeholder="z.B. nord"
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            aria-pressed={mode === 'camera'}
            onclick={() => (mode = 'camera')}
            class="border-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {mode ===
            'camera'
              ? 'border-accent text-accent'
              : 'border-border text-fg-muted'}">Kamera</button
          >
          <button
            type="button"
            aria-pressed={mode === 'manual'}
            onclick={() => (mode = 'manual')}
            class="border-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {mode ===
            'manual'
              ? 'border-accent text-accent'
              : 'border-border text-fg-muted'}">Manuell</button
          >
        </div>
      </div>

      <!-- Ergebnis-Overlay (persistente Live-Region fuer Screenreader) -->
      <div role="status" aria-live="assertive">
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
      </div>

      {#if mode === 'camera'}
        <div class="mt-6 mx-auto max-w-sm">
          <Scanner onDetect={handleToken} {paused} />
          <p class="mt-3 text-center text-xs text-fg-muted">
            QR-Code des Tickets vor die Kamera halten.
          </p>
        </div>
      {:else}
        <form onsubmit={submitManual} class="mt-6 space-y-4">
          <label class="block">
            <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
              >QR-Token</span
            >
            <input
              type="text"
              bind:value={token}
              placeholder="1.xxxxxxxx.xxxx…"
              disabled={processing}
              class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </label>
          <Button type="submit" variant="yellow" disabled={processing}>
            {processing ? '…' : 'Scannen'}
          </Button>
        </form>
      {/if}
    {/if}
  </section>
</Container>
