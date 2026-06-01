<script lang="ts">
  interface Props {
    level?: 1 | 2 | 3 | 4;
    display?: boolean;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { level = 2, display = false, class: className = '', children }: Props = $props();

  const sizeByLevel = {
    1: 'text-4xl md:text-5xl',
    2: 'text-3xl md:text-4xl',
    3: 'text-2xl md:text-3xl',
    4: 'text-xl md:text-2xl',
  };
</script>

{#if level === 1}
  <h1
    class="{display
      ? 'font-display font-black uppercase tracking-[var(--tracking-claim)]'
      : 'font-body font-bold'} {sizeByLevel[level]} text-fg {className}"
  >
    {@render children?.()}
  </h1>
{:else if level === 2}
  <h2
    class="{display
      ? 'font-display font-black uppercase tracking-[var(--tracking-claim)]'
      : 'font-body font-bold'} {sizeByLevel[level]} text-fg {className}"
  >
    {@render children?.()}
  </h2>
{:else if level === 3}
  <h3 class="font-body font-bold {sizeByLevel[level]} text-fg {className}">
    {@render children?.()}
  </h3>
{:else}
  <h4 class="font-body font-bold {sizeByLevel[level]} text-fg {className}">
    {@render children?.()}
  </h4>
{/if}
