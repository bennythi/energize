import { queries } from '@platform/sanity-client';

export const load = async () => {
  const faq = await queries.faq();
  return { faq };
};
