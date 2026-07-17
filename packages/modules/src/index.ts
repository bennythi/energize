export type {
  ModuleSlug,
  NavPlacement,
  NavRequires,
  ModuleNavLink,
  ModuleConfig,
  InstanceBrand,
  InstanceConfig,
} from './types.js';

export { MODULE_REGISTRY, ALL_MODULE_SLUGS } from './registry.js';
export { moduleEnabled, enabledModuleSlugs } from './is-enabled.js';
