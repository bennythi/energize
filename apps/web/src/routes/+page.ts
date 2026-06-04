import { queries } from '@energize/sanity-client';

export const load = async () => {
  const settings = await queries.siteSettings();
  return { settings };
};
