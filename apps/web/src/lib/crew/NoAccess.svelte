<script lang="ts">
  import { Button } from '@platform/ui';
  import { t } from '$lib/i18n';

  interface Props {
    area: string;
  }
  let { area }: Props = $props();
</script>

<div class="card mt-8 p-6">
  <p class="font-medium text-fg">{t('Kein Zugriff', 'No access')}</p>
  <p class="mt-2 text-sm text-fg-muted">
    {t(
      `Du hast noch keine Berechtigung fuer ${area}. Ein Admin kann dich unter Admin → Rechte freischalten.`,
      `You don't have permission for ${area} yet. An admin can grant it under Admin → Permissions.`,
    )}
  </p>
  <div class="mt-5">
    <Button href="/crew" variant="ghost"
      >{t('Zurueck zum Crew-Bereich', 'Back to crew area')}</Button
    >
  </div>
</div>
