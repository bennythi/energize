<script lang="ts">
  interface Props {
    href?: string;
    label?: string;
  }
  let { href = '/crew', label = 'Crew-Bereich' }: Props = $props();
</script>

<a
  {href}
  class="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-accent"
>
  ← {label}
</a>
