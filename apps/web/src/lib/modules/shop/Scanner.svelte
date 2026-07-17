<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { IScannerControls } from '@zxing/browser';

  interface Props {
    onDetect: (token: string) => void;
    // Wenn true, werden erkannte Codes nicht gemeldet (z.B. waehrend ein
    // Ergebnis angezeigt wird). Kamera laeuft weiter.
    paused?: boolean;
  }
  let { onDetect, paused = false }: Props = $props();

  let videoEl = $state<HTMLVideoElement | null>(null);
  let controls: IScannerControls | null = null;
  let active = $state(false);
  let starting = $state(false);
  let error = $state<string | null>(null);
  let torchOn = $state(false);
  let torchSupported = $state(false);

  // Denselben, durchgehend vorgehaltenen Code nicht mehrfach melden. Erst
  // wenn er einige Frames lang aus dem Bild war, wird er wieder zugelassen.
  // (Kein Wall-Clock-Fenster: das Ergebnis-Overlay pausiert laenger, als ein
  //  Zeitfenster sinnvoll waere.)
  let lastText = '';
  let emptyFrames = 0;
  // Cancel-Flag: verhindert Kamera-Leak, wenn die Komponente waehrend des
  // asynchronen start() zerstoert oder der Modus gewechselt wird.
  let disposed = false;

  export async function start() {
    if (active || starting || !videoEl) return;
    starting = true;
    error = null;
    disposed = false;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        error = 'Kamera benoetigt HTTPS (oder localhost).';
        return;
      }
      // Lib erst hier laden (kein SSR/Prerender, kleineres Initial-Bundle).
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 100,
      });
      const c = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoEl,
        (result) => {
          if (paused) return; // waehrend Ergebnis-Overlay: nichts melden/reseten
          if (!result) {
            // Kein Code im Bild: nach ein paar leeren Frames denselben Code
            // wieder zulassen (Ticket wurde weggenommen). Toleriert Wackler.
            if (++emptyFrames >= 3) lastText = '';
            return;
          }
          emptyFrames = 0;
          const text = result.getText();
          if (text === lastText) return; // gleicher, noch vorgehaltener Token
          lastText = text;
          onDetect(text);
        },
      );
      // Wurde waehrend des await zerstoert/gewechselt? Stream sofort freigeben.
      if (disposed) {
        try {
          c.stop();
        } catch {
          // ignorieren
        }
        return;
      }
      controls = c;
      active = true;
      torchSupported = typeof controls.switchTorch === 'function';
    } catch (err) {
      console.error('[scanner] start failed', err);
      const name = err instanceof DOMException ? err.name : '';
      error =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Kamerazugriff verweigert. Bitte im Browser erlauben.'
          : name === 'NotFoundError' || name === 'DevicesNotFoundError'
            ? 'Keine Kamera gefunden.'
            : name === 'NotReadableError' || name === 'TrackStartError'
              ? 'Kamera wird von einer anderen App belegt.'
              : 'Kamera nicht verfuegbar.';
    } finally {
      starting = false;
    }
  }

  export function stop() {
    try {
      controls?.stop();
    } catch {
      // ignorieren
    }
    controls = null;
    active = false;
    torchOn = false;
  }

  function toggleTorch() {
    if (!controls || !controls.switchTorch) return;
    torchOn = !torchOn;
    try {
      void controls.switchTorch(torchOn);
    } catch {
      torchSupported = false;
    }
  }

  // Beim Mount automatisch starten (start() schuetzt vor Doppelaufruf); bei
  // fehlender Berechtigung faellt es auf den "Kamera starten"-Button zurueck.
  onMount(() => {
    void start();
  });
  onDestroy(() => {
    disposed = true;
    stop();
  });
</script>

<div class="relative overflow-hidden border-2 border-border bg-bg">
  <video bind:this={videoEl} class="block aspect-square w-full object-cover" playsinline muted
  ></video>

  {#if active}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="h-2/3 w-2/3 border-2 border-accent shadow-[var(--shadow-glow)]"></div>
    </div>
  {:else}
    <div
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center"
    >
      {#if error}
        <p role="alert" class="font-mono text-xs text-danger">{error}</p>
      {/if}
      <button
        type="button"
        onclick={start}
        disabled={starting}
        class="border-2 border-accent bg-accent px-6 py-3 font-display text-sm font-black uppercase tracking-[var(--tracking-claim)] text-fg-inverse transition-all hover:bg-transparent hover:text-accent disabled:opacity-50"
      >
        {starting ? 'Startet …' : 'Kamera starten'}
      </button>
    </div>
  {/if}

  {#if active && torchSupported}
    <button
      type="button"
      onclick={toggleTorch}
      class="absolute bottom-3 right-3 border-2 border-fg-inverse bg-bg/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg"
    >
      {torchOn ? 'Licht aus' : 'Licht an'}
    </button>
  {/if}
</div>
