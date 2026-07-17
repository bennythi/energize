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
    disabled?: boolean;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    href,
    variant = 'yellow',
    type = 'button',
    onclick,
    disabled = false,
    class: className = '',
    children,
  }: Props = $props();
</script>

{#if href}
  <a {href} class="btn btn-{variant} {className}" rel="noopener">
    <span class="btn-inner">{@render children?.()}</span>
  </a>
{:else}
  <button {type} {onclick} {disabled} class="btn btn-{variant} {className}">
    <span class="btn-inner">{@render children?.()}</span>
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-width: 2px;
    border-style: solid;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 0.875rem;
    line-height: 1;
    letter-spacing: var(--tracking-claim);
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    /* Transitionen explizit — kein `transition: all` (Emil) */
    transition:
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out),
      box-shadow var(--dur-hover) var(--ease-out),
      transform var(--dur-press) var(--ease-out);
    will-change: transform;
  }
  @media (min-width: 768px) {
    .btn {
      font-size: 1rem;
    }
  }

  /* Press-Feedback: leichtes scale, schnell zurueck */
  .btn:active {
    transform: scale(0.97);
  }

  /* Hover-State NUR auf echten Pointer-Devices — sonst stuck-hover
   * auf Touch-Screens nach Tap */
  @media (hover: hover) and (pointer: fine) {
    .btn-yellow:hover {
      background-color: transparent;
      color: var(--color-accent);
      box-shadow: var(--shadow-glow);
    }
    .btn-inverse:hover {
      background-color: var(--color-accent);
      color: var(--color-fg-inverse);
    }
    .btn-ghost:hover {
      background-color: var(--color-fg);
      color: var(--color-fg-inverse);
    }
  }

  /* Varianten */
  .btn-yellow {
    background-color: var(--color-accent);
    color: var(--color-fg-inverse);
    border-color: var(--color-accent);
  }
  .btn-inverse {
    background-color: var(--color-fg-inverse);
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
  .btn-ghost {
    background-color: transparent;
    color: var(--color-fg);
    border-color: var(--color-fg);
  }

  /* Reduced-Motion: transitions auf 0, scale wegnehmen */
  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition:
        background-color 100ms linear,
        color 100ms linear;
    }
    .btn:active {
      transform: none;
    }
  }
</style>
