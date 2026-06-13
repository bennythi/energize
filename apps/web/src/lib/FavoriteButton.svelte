<script lang="ts">
  import { goto } from '$app/navigation';
  import { m } from '@energize/i18n';
  import { auth } from './auth.svelte';
  import { favorites } from './favorites.svelte';

  interface Props {
    artistId: string;
    /** kompakt für Listen-Items, default für Hero-Cards */
    size?: 'sm' | 'md';
    /** dunkler Hintergrund → heller Stern (für Hero-Cards mit Gradient) */
    onDark?: boolean;
  }

  let { artistId, size = 'md', onDark = false }: Props = $props();

  const active = $derived(favorites.has(artistId));

  async function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!auth.user) {
      await goto('/login');
      return;
    }
    await favorites.toggle(artistId);
  }

  const sizes = {
    sm: 'h-11 w-11',
    md: 'h-12 w-12',
  } as const;

  const iconSize = $derived(size === 'sm' ? 16 : 20);
</script>

<button
  type="button"
  onclick={handleClick}
  aria-pressed={active}
  aria-label={active ? m.favorites_aria_remove() : m.favorites_aria_add()}
  class="
    inline-flex items-center justify-center rounded-full border-2 transition-all active:scale-95
    {sizes[size]}
    {active
    ? 'border-accent bg-accent text-fg-inverse'
    : onDark
      ? 'border-fg/40 bg-bg/40 text-fg backdrop-blur hover:border-accent hover:text-accent'
      : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent'}
  "
>
  <svg
    width={iconSize}
    height={iconSize}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
    />
  </svg>
</button>
