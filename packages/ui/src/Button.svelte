<script lang="ts">
  interface Props {
    href?: string;
    variant?: 'primary' | 'ghost';
    type?: 'button' | 'submit';
    onclick?: (event: MouseEvent) => void;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    href,
    variant = 'primary',
    type = 'button',
    onclick,
    class: className = '',
    children,
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center font-display font-black uppercase tracking-[var(--tracking-claim)] px-6 py-3 text-sm md:text-base transition-colors duration-150 border-2 select-none';
  const variants = {
    primary: 'bg-fg text-bg border-fg hover:bg-transparent hover:text-fg',
    ghost: 'bg-transparent text-fg border-fg hover:bg-fg hover:text-bg',
  };
</script>

{#if href}
  <a {href} class="{base} {variants[variant]} {className}" rel="noopener">
    {@render children?.()}
  </a>
{:else}
  <button {type} {onclick} class="{base} {variants[variant]} {className}">
    {@render children?.()}
  </button>
{/if}
