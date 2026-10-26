/**
 * Modul-System: Typvertrag.
 *
 * Die Plattform hat einen unveraenderlichen Kern (accounts) und optionale
 * Module. Jede Instanz waehlt in instances/<name>/instance.config.ts, welche
 * Module aktiv sind. Deaktivierte Module verschwinden aus Navigation und
 * Routing und ihre Pocketbase-Collections werden pro Instanz nicht angelegt.
 */

export type ModuleSlug =
  | 'accounts' // Kern: Auth, Profil, Permissions. Immer aktiv, nicht abschaltbar.
  | 'public-site' // Oeffentliche Seiten: Lineup, FAQ, Anfahrt, Media, Impressum
  | 'ticketshop' // Eigener Shop: Katalog, Warenkorb, Checkout, QR-E-Tickets, Scan
  | 'community' // Oeffentliche Profile, Community-Verzeichnis, Karte
  | 'photo-wall' // Foto-Uploads mit Moderation
  | 'cashless' // Kassen-Abrechnung
  | 'crew-core' // Crew-Dashboard + Permission-Gate (nur Deutsch)
  | 'crew-briefings' // Briefing-Dokumente mit Version
  | 'crew-milestones' // Meilenstein-Tracking
  | 'artist-booking' // Interne DJ-/Artist-Planung: Gage, Rider, Hotel, Reise
  | 'cost-planning' // Festival-Kostenplanung mit Positionen und Angeboten
  | 'support' // Support-Tickets (User schreibt, Admin antwortet)
  | 'friendships' // Freundschaftsanfragen
  | 'map'; // Festival-Karte mit POIs

export type NavPlacement = 'public' | 'account' | 'crew' | 'admin';
export type NavRequires = 'auth' | 'crew' | 'admin';

export interface ModuleNavLink {
  href: string;
  /** i18n-Message-Funktion oder Literal-Funktion, gibt das Label zurueck. */
  label: () => string;
  placement: NavPlacement;
  /** Sichtbarkeitsbedingung ueber den Account-Status. */
  requires?: NavRequires;
  /** Crew-Permission-Slug, der zusaetzlich Leserecht verlangt. */
  resource?: string;
  /** Sortiergewicht innerhalb der Placement-Gruppe (klein = weiter vorn). */
  order?: number;
}

export interface ModuleConfig {
  slug: ModuleSlug;
  /** Basis-Pfad der Modul-Routen, z.B. '/community'. */
  routeBase: string;
  /** Module, die aktiv sein muessen, damit dieses Modul funktioniert. */
  dependsOn?: ModuleSlug[];
  /** Navigations-Links, die dieses Modul beisteuert, wenn es aktiv ist. */
  navLinks?: ModuleNavLink[];
  /** Pocketbase-Collections, die dieses Modul besitzt (fuer Migration-Gating). */
  pbCollections?: string[];
  /** true = Modul ist nur auf Deutsch (keine i18n), z.B. Crew-Bereich. */
  germanOnly?: boolean;
}

export interface InstanceBrand {
  /** Pfad zum Logo im static/brand-Verzeichnis der Instanz. */
  logo: string;
  /** Optionaler Wortmarken-Pfad. */
  wordmark?: string;
  /** Optionaler Favicon-Pfad. */
  favicon?: string;
}

export interface InstanceConfig {
  /** Instanz-Slug, identisch mit dem Ordnernamen unter instances/. */
  slug: string;
  /** Anzeigename der Instanz. */
  name: string;
  /** Verfuegbare Sprachen (Crew bleibt intern immer Deutsch). */
  locales: readonly string[];
  defaultLocale: string;
  brand: InstanceBrand;
  /** Aktive Module dieser Instanz. 'accounts' ist immer implizit aktiv. */
  modules: readonly ModuleSlug[];
}
