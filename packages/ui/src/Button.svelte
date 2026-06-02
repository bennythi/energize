<script lang="ts">
  interface Props {
    href?: string;
    /**
     * Style-Guide-Varianten:
     * - `yellow` → Gelb auf Schwarz (Hero-CTA, Energize-typisch)
     * - `inverse` → Schwarz auf Gelb (Plakat-/Achtung-Style)
     * - `ghost` → Transparenter Button mit weißer Outline
     */
    variant?: 'yellow' | 'inverse' | 'ghost';
    type?: 'button' | 'submit';
    onclick?: (event: MouseEvent) => void;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    href,
    variant = 'yellow',
    type = 'button',
    onclick,
    class: className = '',
    children,
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center font-display font-black uppercase tracking-[var(--tracking-claim)] px-6 py-3 text-sm md:text-base transition-all duration-150 border-2 select-none';
  const variants = {
    yellow:
      'bg-accent text-fg-inverse border-accent hover:bg-transparent hover:text-accent hover:shadow-[var(--shadow-glow)]',
    inverse: 'bg-fg-inverse text-accent border-accent hover:bg-accent hover:text-fg-inverse',
    ghost: 'bg-transparent text-fg border-fg hover:bg-fg hover:text-fg-inverse',
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
