import { queries } from '@energize/sanity-client';
import type { Artist } from '@energize/sanity-client';

export const load = async () => {
  try {
    const [settings, artists] = await Promise.all([queries.siteSettings(), queries.artists()]);
    return {
      settings,
      artists: artists ?? [],
      loadError: null as string | null,
    };
  } catch (err) {
    console.error('[home] sanity fetch failed', err);
    return {
      settings: null,
      artists: [] as Artist[],
      loadError: err instanceof Error ? err.message : 'unknown error',
    };
  }
};
