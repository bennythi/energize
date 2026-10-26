import { requireModule } from '$lib/modules';

export const prerender = false;

export const load = ({ params }: { params: { id: string } }) => {
  requireModule('cost-planning');
  return { id: params.id };
};
