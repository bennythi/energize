import type { InstanceConfig } from '@platform/modules';

/**
 * Neutrale Default-Instanz: nur der Ticketshop. Kein Festival-Ballast,
 * kein spezifisches Branding. Dient als sauberer Ausgangspunkt der Plattform.
 */
export const instance = {
  slug: 'platform',
  name: 'Ticketshop',
  locales: ['de', 'en'],
  defaultLocale: 'de',
  brand: {
    logo: '',
    favicon: '/favicon.svg',
  },
  modules: ['ticketshop'],
} satisfies InstanceConfig;
