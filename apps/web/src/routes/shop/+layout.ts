import { requireModule } from '$lib/modules';

// Shop braucht Laufzeitdaten (Pocketbase), daher nicht prerendern.
export const prerender = false;
export const ssr = false;

export const load = () => {
  requireModule('ticketshop');
};
