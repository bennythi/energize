import { error } from '@sveltejs/kit';
import { queries } from '@energize/sanity-client';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  try {
    const artists = await queries.artists();
    const artist = artists.find((a) => a.slug === params.slug);
    if (!artist) {
      throw error(404, 'Artist nicht gefunden');
    }
    return { artist };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[artist] sanity fetch failed', err);
    throw error(500, 'Lineup konnte nicht geladen werden.');
  }
};
