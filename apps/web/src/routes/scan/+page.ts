import { requireModule } from '$lib/modules';

export const prerender = false;
export const ssr = false;

export const load = () => {
  requireModule('ticketshop');
};
