import { queries } from '@energize/sanity-client';

export const load = async () => {
  const artists = await queries.artists();
  return { artists };
};
