import type { InstanceConfig } from '@platform/modules';

/**
 * Zweite Instanz als Neutralitaets-Nachweis: andere Palette, kleinere
 * Modul-Auswahl. Zeigt, dass derselbe Kern ohne Code-Aenderung neu
 * gebrandet und anders zusammengestellt werden kann.
 */
export const instance = {
  slug: 'demo',
  name: 'Demo Event',
  locales: ['de', 'en'],
  defaultLocale: 'de',
  brand: {
    logo: '/brand/logo_energize.avif',
    favicon: '/favicon.svg',
  },
  modules: ['accounts', 'public-site', 'ticketshop', 'support'],
} satisfies InstanceConfig;
