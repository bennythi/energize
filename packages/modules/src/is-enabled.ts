import type { ModuleSlug } from './types.js';
import { MODULE_REGISTRY } from './registry.js';

/**
 * Ist ein Modul fuer die gegebene Modul-Auswahl aktiv?
 * 'accounts' ist Kern und immer aktiv. Ein Modul gilt nur als aktiv, wenn
 * auch alle seine dependsOn-Module aktiv sind (transitiv nicht aufgeloest,
 * aber die Registry haelt die Ketten flach genug).
 */
export function moduleEnabled(enabledModules: readonly ModuleSlug[], slug: ModuleSlug): boolean {
  if (slug === 'accounts') return true;
  if (!enabledModules.includes(slug)) return false;
  const deps = MODULE_REGISTRY[slug].dependsOn ?? [];
  return deps.every((dep) => moduleEnabled(enabledModules, dep));
}

/** Liste der tatsaechlich aktiven Modul-Slugs (inkl. Kern 'accounts'). */
export function enabledModuleSlugs(enabledModules: readonly ModuleSlug[]): ModuleSlug[] {
  return (Object.keys(MODULE_REGISTRY) as ModuleSlug[]).filter((slug) =>
    moduleEnabled(enabledModules, slug),
  );
}
