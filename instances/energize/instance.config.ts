import type { InstanceConfig } from '@platform/modules';

/**
 * Instanz-Konfiguration fuer das Energize Festival (erste Instanz / Proof of Concept).
 * Waehlt Branding + aktive Module. 'accounts' ist Kern und immer implizit aktiv.
 */
export const instance = {
  slug: 'energize',
  name: 'ENERGIZE Festival',
  locales: ['de', 'en'],
  defaultLocale: 'de',
  brand: {
    logo: '/brand/logo_energize.avif',
    wordmark: '/brand/schriftzug.avif',
    favicon: '/favicon.svg',
  },
  modules: [
    'accounts',
    'public-site',
    'ticketshop',
    'community',
    'photo-wall',
    'cashless',
    'crew-core',
    'crew-briefings',
    'crew-milestones',
    'support',
    'friendships',
    'map',
  ],
} satisfies InstanceConfig;
