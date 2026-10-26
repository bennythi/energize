import type { ModuleConfig, ModuleSlug } from './types.js';

/**
 * Registry aller Module, die die Plattform kann (instanz-unabhaengig).
 * Metadaten fuer Enablement, Abhaengigkeiten, Routing und Migration-Gating.
 * Die konkreten Navigations-Labels leben in der App (i18n + Instanz-Kontext),
 * nicht hier, damit dieses Paket frei von UI-Strings bleibt.
 */
export const MODULE_REGISTRY: Record<ModuleSlug, ModuleConfig> = {
  accounts: {
    slug: 'accounts',
    routeBase: '/account',
    pbCollections: [
      'users',
      'profiles',
      'crew_resources',
      'crew_role_permissions',
      'crew_user_permissions',
    ],
  },
  'public-site': {
    slug: 'public-site',
    routeBase: '/',
    pbCollections: [],
  },
  ticketshop: {
    slug: 'ticketshop',
    routeBase: '/shop',
    dependsOn: ['accounts'],
    pbCollections: [
      'shop_settings',
      'shop_ticket_types',
      'shop_orders',
      'shop_order_items',
      'shop_tickets',
      'shop_payments',
      'shop_outbound_emails',
    ],
  },
  community: {
    slug: 'community',
    routeBase: '/community',
    dependsOn: ['accounts'],
    pbCollections: ['community_posts'],
  },
  'photo-wall': {
    slug: 'photo-wall',
    routeBase: '/wall',
    dependsOn: ['accounts'],
    pbCollections: ['posts', 'post_likes', 'reports'],
  },
  cashless: {
    slug: 'cashless',
    routeBase: '/crew/kasse',
    dependsOn: ['accounts', 'crew-core'],
    germanOnly: true,
    pbCollections: [
      'cashless_registers',
      'cashless_shifts',
      'cashless_shift_denominations',
      'cashless_movements',
    ],
  },
  'crew-core': {
    slug: 'crew-core',
    routeBase: '/crew',
    dependsOn: ['accounts'],
    germanOnly: true,
    pbCollections: ['crew_availability', 'crew_equipment_requests'],
  },
  'crew-briefings': {
    slug: 'crew-briefings',
    routeBase: '/crew/briefings',
    dependsOn: ['crew-core'],
    germanOnly: true,
    pbCollections: ['crew_briefings'],
  },
  'crew-milestones': {
    slug: 'crew-milestones',
    routeBase: '/crew/meilensteine',
    dependsOn: ['crew-core'],
    germanOnly: true,
    pbCollections: ['crew_milestones'],
  },
  'artist-booking': {
    slug: 'artist-booking',
    routeBase: '/crew/booking',
    dependsOn: ['crew-core'],
    germanOnly: true,
    pbCollections: ['booking_editions', 'booking_artists', 'booking_items'],
  },
  'cost-planning': {
    slug: 'cost-planning',
    routeBase: '/crew/kosten',
    dependsOn: ['crew-core'],
    germanOnly: true,
    pbCollections: ['cost_items', 'cost_offers'],
  },
  support: {
    slug: 'support',
    routeBase: '/support',
    dependsOn: ['accounts'],
    pbCollections: ['support_tickets', 'support_messages'],
  },
  friendships: {
    slug: 'friendships',
    routeBase: '/u',
    dependsOn: ['accounts'],
    pbCollections: ['friendships'],
  },
  map: {
    slug: 'map',
    routeBase: '/karte',
    pbCollections: [],
  },
};

/** Alle Modul-Slugs in Registry-Reihenfolge. */
export const ALL_MODULE_SLUGS = Object.keys(MODULE_REGISTRY) as ModuleSlug[];
