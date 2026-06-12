import { queries } from '@energize/sanity-client';
import type { Poi } from '@energize/sanity-client';

export const load = async () => {
  try {
    const pois = await queries.pois();
    return { pois: pois ?? [], loadError: null as string | null };
  } catch (err) {
    console.error('[karte] sanity fetch failed', err);
    return {
      pois: [] as Poi[],
      loadError: err instanceof Error ? err.message : 'unknown error',
    };
  }
};
