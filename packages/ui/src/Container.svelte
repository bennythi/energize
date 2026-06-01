<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg' | 'full';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { size = 'lg', class: className = '', children }: Props = $props();

  const max = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-none',
  };
</script>

<div class="mx-auto w-full px-4 sm:px-6 lg:px-8 {max[size]} {className}">
  {@render children?.()}
</div>
