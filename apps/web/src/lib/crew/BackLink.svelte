<script lang="ts">
  import { t } from '$lib/i18n';

  interface Props {
    href?: string;
    label?: string;
  }
  let { href = '/crew', label = t('Crew-Bereich', 'Crew area') }: Props = $props();
</script>

<a
  {href}
  class="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-accent"
>
  ← {label}
</a>
