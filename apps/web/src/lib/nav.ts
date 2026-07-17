import { m } from '@platform/i18n';
import { isModuleEnabled } from '$lib/modules';
import type { ModuleSlug } from '@platform/modules';

export interface NavLink {
  href: string;
  label: string;
}

interface NavDescriptor extends NavLink {
  /** Modul, an das dieser Link gebunden ist. Nur sichtbar, wenn aktiv. */
  module: ModuleSlug;
}

/**
 * Oeffentliche Navigations-Links, jeweils an ein Modul gebunden.
 * Labels via i18n (bzw. Literal), damit sie zur aktuellen Sprache passen.
 * Als Funktion, weil m.xxx() erst nach setLanguageTag() korrekt ist und der
 * Aufruf im $derived des Layouts pro Sprachwechsel neu ausgewertet wird.
 */
export function publicNavLinks(): NavLink[] {
  const links: NavDescriptor[] = [
    { href: '/lineup', label: m.nav_lineup(), module: 'public-site' },
    { href: '/shop', label: m.nav_tickets_short(), module: 'ticketshop' },
    { href: '/media', label: 'Media', module: 'public-site' },
    { href: '/background', label: 'Background', module: 'public-site' },
    { href: '/community', label: m.nav_community(), module: 'community' },
    { href: '/faq', label: m.nav_faq(), module: 'public-site' },
    { href: '/anfahrt', label: m.nav_anfahrt(), module: 'public-site' },
    { href: '/support', label: 'Support', module: 'support' },
  ];
  return links
    .filter((link) => isModuleEnabled(link.module))
    .map(({ href, label }) => ({ href, label }));
}
