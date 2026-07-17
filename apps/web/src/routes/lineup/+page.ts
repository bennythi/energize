import { queries } from '@platform/sanity-client';
import type { Artist } from '@platform/sanity-client';

export const load = async () => {
  try {
    const artists = await queries.artists();
    return { artists: artists ?? [], loadError: null as string | null };
  } catch (err) {
    console.error('[lineup] sanity fetch failed', err);
    return {
      artists: [] as Artist[],
      loadError: err instanceof Error ? err.message : 'unknown error',
    };
  }
};
