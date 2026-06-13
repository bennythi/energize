<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Container, Button } from '@energize/ui';
  import { m } from '@energize/i18n';
  import { auth, isAuthConfigured } from '$lib/auth.svelte';
  import { resizeImage } from '$lib/imageResize';

  const MAX_BYTES = 8 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  let file = $state<File | null>(null);
  let caption = $state('');
  let preview = $state<string | null>(null);

  let status = $state<'idle' | 'processing' | 'uploading' | 'done'>('idle');
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (!isAuthConfigured || (!auth.loading && !auth.user)) {
      void goto('/login', { replaceState: true });
    }
  });

  function handlePick(event: Event) {
    errorMsg = null;
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0] ?? null;
    if (!picked) {
      file = null;
      preview = null;
      return;
    }
    if (picked.size > MAX_BYTES) {
      errorMsg = m.upload_error_size();
      file = null;
      preview = null;
      return;
    }
    if (!ALLOWED.includes(picked.type)) {
      errorMsg = m.upload_error_type();
      file = null;
      preview = null;
      return;
    }
    file = picked;
    if (preview) URL.revokeObjectURL(preview);
    preview = URL.createObjectURL(picked);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!file) return;
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;

    errorMsg = null;
    status = 'processing';

    try {
      const resized = await resizeImage(file);
      status = 'uploading';

      const ext = 'jpg';
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${fileName}`;

      const upload = await client.storage.from('posts').upload(path, resized.blob, {
        contentType: resized.type,
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const insert = await client.from('posts').insert({
        user_id: user.id,
        image_path: path,
        caption: caption.trim() || null,
        status: 'pending',
      });
      if (insert.error) throw insert.error;

      status = 'done';
    } catch (err) {
      console.error('[wall/upload] failed', err);
      errorMsg = m.upload_error_generic();
      status = 'idle';
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    preview = null;
    file = null;
    caption = '';
    status = 'idle';
    errorMsg = null;
  }

  // Falls die Seite waehrend in-flight upload unmountet wird
  // (Back-Button, Tab-Wechsel), die Object-URL freigeben.
  onDestroy(() => {
    if (preview) URL.revokeObjectURL(preview);
  });
</script>

<svelte:head>
  <title>{m.upload_title()} — ENERGIZE</title>
</svelte:head>

<Container size="sm">
  <section class="py-16 md:py-20">
    {#if status === 'done'}
      <div class="border-2 border-accent bg-surface p-8 text-center">
        <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">✓</p>
        <h1
          class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
          style="font-size: clamp(2rem, 6vw, 3.5rem);"
        >
          {m.upload_success_title()}
        </h1>
        <p class="mt-4 text-fg-muted">{m.upload_success_body()}</p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/wall" variant="yellow">{m.upload_back_to_wall()}</Button>
          <Button variant="ghost" onclick={reset}>{m.upload_another()}</Button>
        </div>
      </div>
    {:else}
      <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
        {m.wall_title()}
      </p>
      <h1
        class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
        style="font-size: clamp(2rem, 6vw, 3.5rem);"
      >
        {m.upload_title()}
      </h1>
      <p class="mt-4 text-fg-muted">{m.upload_lead()}</p>

      <form onsubmit={handleSubmit} class="mt-10 space-y-8">
        <!-- File-Picker -->
        <div>
          <label class="block">
            <span
              class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted"
            >
              {m.upload_pick_label()}
            </span>
            <span
              class="mt-2 flex items-center justify-center border-2 border-dashed border-border bg-surface px-4 py-12 transition-colors hover:border-accent {preview
                ? 'aspect-square overflow-hidden p-0'
                : ''}"
            >
              {#if preview}
                <img src={preview} alt="Vorschau" class="h-full w-full object-cover" />
              {:else}
                <span class="text-center">
                  <span class="block font-display text-3xl font-black uppercase text-accent">
                    +
                  </span>
                  <span
                    class="mt-2 block font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                  >
                    {m.upload_pick_hint()}
                  </span>
                </span>
              {/if}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onchange={handlePick}
                disabled={status !== 'idle'}
                class="sr-only"
              />
            </span>
          </label>
        </div>

        <!-- Caption -->
        <label class="block">
          <span class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted">
            {m.upload_caption_label()}
          </span>
          <textarea
            bind:value={caption}
            placeholder={m.upload_caption_placeholder()}
            rows="2"
            maxlength="280"
            disabled={status !== 'idle'}
            class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          ></textarea>
        </label>

        {#if errorMsg}
          <p class="text-sm text-danger" role="alert">{errorMsg}</p>
        {/if}

        <Button type="submit" variant="yellow">
          {#if status === 'processing'}
            {m.upload_processing()}
          {:else if status === 'uploading'}
            {m.upload_uploading()}
          {:else}
            {m.upload_submit()}
          {/if}
        </Button>
      </form>

      <!-- Rules -->
      <section class="mt-16 border-l-4 border-accent bg-surface p-6">
        <h2
          class="font-display text-lg font-black uppercase tracking-[var(--tracking-claim)] text-accent"
        >
          {m.upload_rules_title()}
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-fg-muted">
          <li class="flex gap-3">
            <span class="text-accent">·</span>
            <span>{m.upload_rules_1()}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent">·</span>
            <span>{m.upload_rules_2()}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent">·</span>
            <span>{m.upload_rules_3()}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent">·</span>
            <span>{m.upload_rules_4()}</span>
          </li>
        </ul>
      </section>
    {/if}
  </section>
</Container>
