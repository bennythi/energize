/**
 * Typings zu den Sanity-Schemas in apps/studio/schemas.
 * Manuell gepflegt — bei Schema-Änderungen hier nachziehen.
 *
 * Später (Phase 3+) lohnt sich `@sanity/codegen` für Auto-Generation.
 */

export type Locale = 'de' | 'en';

export interface LocalizedString {
  de?: string;
  en?: string;
}

export interface LocalizedText {
  de?: string;
  en?: string;
}

export interface PortableTextBlock {
  _type: 'block';
  _key?: string;
  style?: string;
  children: Array<{
    _type: string;
    text?: string;
    marks?: string[];
  }>;
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
}

export interface SanityImage {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
}

// ===== siteSettings =====

export interface SiteSettings {
  festivalName: string;
  edition: number;
  seasonMotto?: LocalizedString;
  venueSubtitle?: LocalizedString;
  venueAddress?: {
    street?: string;
    postalCode?: string;
    city?: string;
    region?: string;
    geo?: { lat: number; lng: number };
  };
  parkingTicketUrl?: string;
  shuttleTicketUrl?: string;
  shuttleNote?: LocalizedText;
  festivalStart?: string;
  festivalEnd?: string;
  warmupStreamStart?: string;
  openingRitual?: string;
  endshowStart?: string;
  ticketUrl: string;
  cashlessUrl?: string;
  tickeeSupportEmail?: string;
  twitchChannel?: string;
  twitchLive?: boolean;
  socials?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
  };
  contactEmail?: string;
}

// ===== Artist =====

export interface Artist {
  _id: string;
  name: string;
  slug: string;
  photo?: SanityImage;
  bio?: LocalizedText;
  slotStart?: string;
  slotEnd?: string;
  isLive?: boolean;
  featured?: boolean;
  links?: {
    spotify?: string;
    soundcloud?: string;
    instagram?: string;
    youtube?: string;
  };
  order?: number;
}

// ===== FAQ =====

export type FaqCategory =
  | 'tickets'
  | 'anreise'
  | 'hausordnung'
  | 'cashless'
  | 'awareness'
  | 'general';

export interface FaqEntry {
  _id: string;
  question: LocalizedString;
  answer: LocalizedText;
  category: FaqCategory;
  order?: number;
}

// ===== POI =====

export type PoiType =
  | 'stage'
  | 'toilet'
  | 'medic'
  | 'bar'
  | 'food'
  | 'entry'
  | 'cashless'
  | 'parking'
  | 'info'
  | 'other';

export interface Poi {
  _id: string;
  name: LocalizedString;
  svgId: string;
  type: PoiType;
  description?: LocalizedText;
  order?: number;
}

// ===== Sponsor =====

export type SponsorTier = 'gold' | 'silver' | 'partner' | 'media';

export interface Sponsor {
  _id: string;
  name: string;
  logo?: SanityImage;
  url?: string;
  tier: SponsorTier;
  order?: number;
}

// ===== Media =====

export type MediaType = 'aftermovie' | 'endshow' | 'gallery' | 'news';

export interface MediaItem {
  _id: string;
  title: LocalizedString;
  type: MediaType;
  year: number;
  youtubeId?: string;
  coverImage?: SanityImage;
  description?: LocalizedText;
  order?: number;
}

// ===== Page =====

export type PageAudience = 'public' | 'login' | 'hybrid';

export interface Page {
  _id: string;
  title: LocalizedString;
  slug: string;
  audience: PageAudience;
  heroImage?: SanityImage;
  body?: {
    de?: PortableTextBlock[];
    en?: PortableTextBlock[];
  };
  order?: number;
}
