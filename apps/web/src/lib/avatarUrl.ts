import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!PUBLIC_SUPABASE_URL) return null;
  const base = PUBLIC_SUPABASE_URL.replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/avatars/${path}`;
}
