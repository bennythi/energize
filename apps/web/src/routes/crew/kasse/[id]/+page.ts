import { requireModule } from '$lib/modules';

// Dynamische Route (Schicht-ID aus der URL), kein Prerender.
export const prerender = false;
export const ssr = false;

export const load = () => {
  requireModule('cashless');
};
