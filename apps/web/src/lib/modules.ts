import { error } from '@sveltejs/kit';
import { instance } from '$instance/instance.config';
import { MODULE_REGISTRY, moduleEnabled, type ModuleSlug } from '@platform/modules';

/**
 * App-seitige Bindung des Modul-Systems an die aktive Instanz.
 * Die Instanz wird zur Build-Zeit ueber den $instance-Alias gewaehlt
 * (INSTANCE=<slug>), ihre Modul-Auswahl ist damit eine Build-Konstante.
 */
export const activeInstance = instance;
export { MODULE_REGISTRY };

/** Ist das Modul in dieser Instanz aktiv? 'accounts' ist immer aktiv. */
export function isModuleEnabled(slug: ModuleSlug): boolean {
  return moduleEnabled(instance.modules, slug);
}

/** Startseite der Instanz: Ticketshop, falls aktiv, sonst der Crew-Bereich. */
export function homePath(): string {
  if (isModuleEnabled('ticketshop')) return '/shop';
  if (isModuleEnabled('crew-core')) return '/crew';
  return '/account';
}

/** Ziel nach dem Login: Crew/Admins in den Crew-Bereich, sonst Account. */
export function afterLoginPath(isCrew: boolean): string {
  if (isCrew && isModuleEnabled('crew-core')) return '/crew';
  return '/account';
}

/**
 * Guard fuer Modul-Routen: in +layout.ts / +page.ts eines Moduls aufrufen.
 * Deaktivierte Module liefern 404 statt einer halb funktionierenden Seite.
 */
export function requireModule(slug: ModuleSlug): void {
  if (!isModuleEnabled(slug)) {
    error(404, 'Dieses Modul ist fuer diese Instanz nicht aktiv.');
  }
}
