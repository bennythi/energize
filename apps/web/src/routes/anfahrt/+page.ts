import { queries } from '@energize/sanity-client';

export const load = async () => {
  const [settings, faq] = await Promise.all([queries.siteSettings(), queries.faq()]);
  return {
    settings,
    anreiseFaq: faq.filter((e) => e.category === 'anreise'),
  };
};
