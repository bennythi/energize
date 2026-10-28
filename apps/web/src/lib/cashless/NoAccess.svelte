<script lang="ts">
  import { Button } from '@platform/ui';
  import { t } from '$lib/i18n';
</script>

<div class="card mt-8 p-6">
  <p class="font-medium text-fg">{t('Kein Zugriff', 'No access')}</p>
  <p class="mt-2 text-sm text-fg-muted">
    {t(
      'Fuer die Cashless-Kassen fehlt dir die Berechtigung. Ein Admin kann dich unter Admin → Rechte freischalten.',
      "You don't have permission for the cashless registers. An admin can grant it under Admin → Permissions.",
    )}
  </p>
  <div class="mt-5">
    <Button href="/crew" variant="ghost">{t('Zurueck zur Crew', 'Back to crew')}</Button>
  </div>
</div>
