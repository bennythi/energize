<script lang="ts">
  import { Button } from '@platform/ui';

  interface Props {
    area: string;
  }
  let { area }: Props = $props();
</script>

<div class="card mt-8 p-6">
  <p class="font-medium text-fg">Kein Zugriff</p>
  <p class="mt-2 text-sm text-fg-muted">
    Du hast noch keine Berechtigung fuer {area}. Ein Admin kann dich unter Admin → Rechte
    freischalten.
  </p>
  <div class="mt-5"><Button href="/crew" variant="ghost">Zurueck zum Crew-Bereich</Button></div>
</div>
