import { sanity } from './client.js';
import type { Artist, FaqEntry, MediaItem, Page, Poi, SiteSettings, Sponsor } from './types.js';

const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    festivalName,
    edition,
    seasonMotto,
    venueSubtitle,
    venueAddress,
    parkingTicketUrl,
    shuttleTicketUrl,
    shuttleNote,
    festivalStart,
    festivalEnd,
    warmupStreamStart,
    openingRitual,
    endshowStart,
    ticketUrl,
    cashlessUrl,
    tickeeSupportEmail,
    twitchChannel,
    twitchLive,
    socials,
    contactEmail
  }
`;

const ARTISTS_QUERY = `
  *[_type == "artist"] | order(featured desc, name asc){
    _id,
    name,
    "slug": slug.current,
    photo,
    bio,
    slotStart,
    slotEnd,
    isLive,
    featured,
    links,
    order
  }
`;

const ARTIST_BY_SLUG_QUERY = `
  *[_type == "artist" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    photo,
    bio,
    slotStart,
    slotEnd,
    isLive,
    featured,
    links,
    order
  }
`;

const FAQ_QUERY = `
  *[_type == "faqEntry"] | order(category asc, order asc){
    _id,
    question,
    answer,
    category,
    order
  }
`;

const POIS_QUERY = `
  *[_type == "poi"] | order(type asc, order asc){
    _id,
    name,
    svgId,
    type,
    description,
    order
  }
`;

const SPONSORS_QUERY = `
  *[_type == "sponsor"] | order(tier asc, order asc){
    _id,
    name,
    logo,
    url,
    tier,
    order
  }
`;

const MEDIA_QUERY = `
  *[_type == "mediaItem"] | order(year desc, order asc){
    _id,
    title,
    type,
    year,
    youtubeId,
    coverImage,
    description,
    order
  }
`;

const PAGES_QUERY = `
  *[_type == "page" && audience in ["public", "hybrid"]] | order(order asc){
    _id,
    title,
    "slug": slug.current,
    audience,
    heroImage,
    body,
    order
  }
`;

const PAGE_BY_SLUG_QUERY = `
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    audience,
    heroImage,
    body
  }
`;

export const queries = {
  siteSettings: () => sanity.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  artists: () => sanity.fetch<Artist[]>(ARTISTS_QUERY),
  artistBySlug: (slug: string) => sanity.fetch<Artist | null>(ARTIST_BY_SLUG_QUERY, { slug }),
  faq: () => sanity.fetch<FaqEntry[]>(FAQ_QUERY),
  pois: () => sanity.fetch<Poi[]>(POIS_QUERY),
  sponsors: () => sanity.fetch<Sponsor[]>(SPONSORS_QUERY),
  media: () => sanity.fetch<MediaItem[]>(MEDIA_QUERY),
  pages: () => sanity.fetch<Page[]>(PAGES_QUERY),
  pageBySlug: (slug: string) => sanity.fetch<Page | null>(PAGE_BY_SLUG_QUERY, { slug }),
};

export {
  SITE_SETTINGS_QUERY,
  ARTISTS_QUERY,
  FAQ_QUERY,
  POIS_QUERY,
  SPONSORS_QUERY,
  MEDIA_QUERY,
  PAGES_QUERY,
  PAGE_BY_SLUG_QUERY,
};
