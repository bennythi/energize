<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';
  import { resizeImage } from '$lib/imageResize';
  import { avatarUrl } from '$lib/avatarUrl';

  interface Props {
    currentPath: string | null;
    onUpdated: (newPath: string | null) => void;
  }
  let { currentPath, onUpdated }: Props = $props();

  const MAX_BYTES = 4 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

  let fileInput: HTMLInputElement | null = $state(null);
  let preview = $state<string | null>(null);
  let status = $state<'idle' | 'processing' | 'uploading' | 'deleting'>('idle');
  let errorMsg = $state<string | null>(null);

  const displayedUrl = $derived(preview ?? avatarUrl(currentPath));

  function openPicker() {
    errorMsg = null;
    fileInput?.click();
  }

  async function handlePick(event: Event) {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (!picked) return;

    errorMsg = null;
    if (picked.size > MAX_BYTES) {
      errorMsg = 'Bild zu gross. Maximal 4 MB.';
      return;
    }
    if (!ALLOWED.includes(picked.type)) {
      errorMsg = 'Nur JPEG, PNG oder WebP.';
      return;
    }

    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;

    if (preview) URL.revokeObjectURL(preview);
    preview = URL.createObjectURL(picked);

    status = 'processing';
    try {
      const resized = await resizeImage(picked, 512, 0.9);
      status = 'uploading';

      const path = `${user.id}/avatar-${crypto.randomUUID()}.jpg`;
      const upload = await client.storage.from('avatars').upload(path, resized.blob, {
        contentType: resized.type,
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const previousPath = currentPath;
      const update = await client.from('profiles').update({ avatar_path: path }).eq('id', user.id);
      if (update.error) throw update.error;

      if (previousPath) {
        await client.storage.from('avatars').remove([previousPath]);
      }

      onUpdated(path);
      status = 'idle';
    } catch (err) {
      console.error('[avatar] upload failed', err);
      errorMsg = 'Upload fehlgeschlagen. Probier es nochmal.';
      if (preview) {
        URL.revokeObjectURL(preview);
        preview = null;
      }
      status = 'idle';
    }
  }

  async function handleRemove() {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !currentPath) return;

    if (!confirm('Profilbild wirklich entfernen?')) return;

    errorMsg = null;
    status = 'deleting';
    const pathToRemove = currentPath;
    try {
      const update = await client.from('profiles').update({ avatar_path: null }).eq('id', user.id);
      if (update.error) throw update.error;

      await client.storage.from('avatars').remove([pathToRemove]);

      if (preview) {
        URL.revokeObjectURL(preview);
        preview = null;
      }
      onUpdated(null);
      status = 'idle';
    } catch (err) {
      console.error('[avatar] remove failed', err);
      errorMsg = 'Konnte das Bild nicht entfernen.';
      status = 'idle';
    }
  }

  onDestroy(() => {
    if (preview) URL.revokeObjectURL(preview);
  });
</script>

<div class="flex items-center gap-5">
  <div
    class="relative h-24 w-24 shrink-0 overflow-hidden border-2 border-fg bg-surface"
    aria-hidden={!displayedUrl}
  >
    {#if displayedUrl}
      <img src={displayedUrl} alt="" class="h-full w-full object-cover" />
    {:else}
      <div
        class="flex h-full w-full items-center justify-center font-display text-3xl font-black uppercase text-fg-muted"
      >
        ?
      </div>
    {/if}
    {#if status === 'processing' || status === 'uploading' || status === 'deleting'}
      <div
        class="absolute inset-0 flex items-center justify-center bg-bg/80 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
      >
        {status === 'deleting' ? 'Entfernt' : status === 'uploading' ? 'Upload' : 'Verarbeite'}
      </div>
    {/if}
  </div>

  <div class="flex-1">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
      Profilbild
    </p>
    <p class="mt-1 text-sm text-fg-muted">
      Quadratisch, mind. 256 px. JPEG, PNG oder WebP, max. 4 MB.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button variant="ghost" onclick={openPicker} disabled={status !== 'idle'}>
        {currentPath ? 'Ersetzen' : 'Hochladen'}
      </Button>
      {#if currentPath}
        <Button variant="ghost" onclick={handleRemove} disabled={status !== 'idle'}>
          Entfernen
        </Button>
      {/if}
    </div>
    {#if errorMsg}
      <p class="mt-2 font-mono text-xs text-[var(--color-red,#E24B4A)]">{errorMsg}</p>
    {/if}
  </div>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    bind:this={fileInput}
    onchange={handlePick}
    class="hidden"
  />
</div>
