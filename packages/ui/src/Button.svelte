<script lang="ts">
  interface Props {
    href?: string;
    /**
     * Varianten:
     * - `yellow`  -> Primaer: gefuellter Akzent mit Glow (Haupt-CTA)
     * - `inverse` -> Primaer-Alternative (identisch, Legacy-Name)
     * - `ghost`   -> Glas: transluzent mit feinem Rand (sekundaer)
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

  const cls = $derived(variant === 'ghost' ? 'btn btn-glass' : 'btn btn-primary');
</script>

{#if href}
  <a {href} class="{cls} {className}" rel="noopener">{@render children?.()}</a>
{:else}
  <button {type} {onclick} {disabled} class="{cls} {className}">{@render children?.()}</button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1.4rem;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1;
    letter-spacing: -0.01em;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    /* Nur transform/box-shadow/background animieren (GPU-freundlich, Emil). */
    transition:
      transform var(--dur-press) var(--ease-spring),
      box-shadow var(--dur-hover) var(--ease-out),
      background-color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out);
    will-change: transform;
  }

  /* Press-Feedback: leichtes scale mit Spring. */
  .btn:active {
    transform: scale(0.97);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Primaer: gefuellter Akzent, dezenter oberer Highlight, Glow. */
  .btn-primary {
    background-color: var(--color-accent);
    color: var(--color-fg-inverse);
    box-shadow:
      inset 0 1px 0 var(--glass-highlight),
      0 6px 20px var(--color-accent-glow);
  }

  /* Glas: transluzent mit Blur + feinem Rand. */
  .btn-glass {
    background-color: var(--glass-bg);
    color: var(--color-fg);
    border-color: var(--glass-border);
    backdrop-filter: blur(var(--glass-blur)) saturate(150%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(150%);
  }

  @media (hover: hover) and (pointer: fine) {
    .btn:hover {
      transform: translateY(-1px);
    }
    .btn-primary:hover {
      box-shadow:
        inset 0 1px 0 var(--glass-highlight),
        0 10px 30px var(--color-accent-glow);
    }
    .btn-glass:hover {
      background-color: var(--glass-bg-strong);
      border-color: var(--color-accent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition:
        background-color 120ms linear,
        border-color 120ms linear;
    }
    .btn:active,
    .btn:hover {
      transform: none;
    }
  }
</style>
