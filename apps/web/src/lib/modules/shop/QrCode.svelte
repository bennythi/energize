<script lang="ts">
  import QRCode from 'qrcode';

  interface Props {
    value: string;
    size?: number;
  }
  let { value, size = 220 }: Props = $props();

  let dataUrl = $state('');

  // QR immer dunkel-auf-hell rendern (Scanbarkeit unabhaengig vom Theme).
  $effect(() => {
    if (!value) {
      dataUrl = '';
      return;
    }
    void QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((u) => (dataUrl = u))
      .catch(() => (dataUrl = ''));
  });
</script>

{#if dataUrl}
  <img
    src={dataUrl}
    alt="Ticket-QR-Code"
    width={size}
    height={size}
    class="block bg-white p-2"
    style={`width:${size}px;height:${size}px;`}
  />
{:else}
  <div
    class="flex items-center justify-center bg-surface text-xs text-fg-muted"
    style={`width:${size}px;height:${size}px;`}
  >
    …
  </div>
{/if}
