<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '@platform/ui';
  import { auth } from '$lib/auth.svelte';
  import { scanTicket, type ScanResponse } from '$lib/modules/shop/api';
  import Scanner from '$lib/modules/shop/Scanner.svelte';

  let mode = $state<'camera' | 'manual'>('camera');
  let gate = $state('');
  let token = $state('');
  let processing = $state(false);
  let result = $state<ScanResponse | null>(null);
  let resultTimer: ReturnType<typeof setTimeout> | undefined;

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
      result = { result: 'error', reason: err instanceof Error ? err.message : 'network' };
    } finally {
      processing = false;
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
      ? 'res-valid'
      : r === 'already_used'
        ? 'res-used'
        : r === 'error'
          ? 'res-error'
          : 'res-invalid';
  }
  function resultLabel(r: ScanResponse['result']): string {
    return r === 'valid'
      ? 'Gueltig'
      : r === 'already_used'
        ? 'Bereits verwendet'
        : r === 'error'
          ? 'Fehler, erneut scannen'
          : 'Ungueltig';
  }
</script>

<svelte:head>
  <title>Einlass-Scan</title>
</svelte:head>

<div class="mx-auto w-full max-w-md px-5 py-10 md:py-16">
  <h1 class="text-3xl font-semibold tracking-tight text-fg md:text-4xl">Einlass-Scan</h1>

  {#if !auth.isCrew}
    <div class="card mt-8 p-6">
      <p class="text-sm text-fg-muted">Dieser Bereich ist nur fuer Crew mit Scan-Berechtigung.</p>
    </div>
  {:else}
    <div class="mt-6 flex items-end justify-between gap-4">
      <label class="block flex-1">
        <span class="text-xs font-medium text-fg-muted">Eingang (optional)</span>
        <input type="text" bind:value={gate} placeholder="z.B. nord" class="field mt-2" />
      </label>
      <div class="seg">
        <button
          type="button"
          aria-pressed={mode === 'camera'}
          class:on={mode === 'camera'}
          onclick={() => (mode = 'camera')}>Kamera</button
        >
        <button
          type="button"
          aria-pressed={mode === 'manual'}
          class:on={mode === 'manual'}
          onclick={() => (mode = 'manual')}>Manuell</button
        >
      </div>
    </div>

    <div role="status" aria-live="assertive">
      {#if result}
        <div class="result {resultClass(result.result)}">
          <p class="text-2xl font-semibold">{resultLabel(result.result)}</p>
          {#if result.result === 'valid'}
            <p class="mt-1 text-sm opacity-90">{result.ticket_type}</p>
          {:else if result.result === 'already_used'}
            <p class="mt-1 text-xs opacity-80">Verwendet: {result.used_at}</p>
          {/if}
        </div>
      {/if}
    </div>

    {#if mode === 'camera'}
      <div class="mt-6 overflow-hidden rounded-2xl">
        <Scanner onDetect={handleToken} {paused} />
      </div>
      <p class="mt-3 text-center text-xs text-fg-muted">
        QR-Code des Tickets vor die Kamera halten.
      </p>
    {:else}
      <form onsubmit={submitManual} class="card mt-6 flex flex-col gap-4 p-6">
        <label class="block">
          <span class="text-xs font-medium text-fg-muted">QR-Token</span>
          <input
            type="text"
            bind:value={token}
            placeholder="1.xxxxxxxx.xxxx…"
            disabled={processing}
            class="field mt-2 font-mono text-sm"
          />
        </label>
        <div>
          <Button type="submit" disabled={processing}>{processing ? '…' : 'Scannen'}</Button>
        </div>
      </form>
    {/if}
  {/if}
</div>

<style>
  .seg {
    display: inline-flex;
    padding: 0.2rem;
    border-radius: var(--radius-pill);
    background-color: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .seg button {
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-fg-muted);
    transition:
      background-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .seg button.on {
    color: var(--color-fg-inverse);
    background-color: var(--color-accent);
  }

  .result {
    margin-top: 1.5rem;
    padding: 1.5rem;
    border-radius: var(--radius-xl);
    text-align: center;
    animation: pop 220ms var(--ease-spring);
  }
  .res-valid {
    background-color: var(--color-success);
    color: #05261a;
  }
  .res-used {
    background-color: var(--color-warn);
    color: #2a1c00;
  }
  .res-invalid {
    background-color: var(--color-danger);
    color: #2a0a0a;
  }
  .res-error {
    background-color: var(--glass-bg-strong);
    color: var(--color-fg);
    border: 1px solid var(--glass-border);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .result {
      animation: none;
    }
  }
</style>
