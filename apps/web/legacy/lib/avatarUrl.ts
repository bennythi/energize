import { env } from '$env/dynamic/public';

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = env.PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}/storage/v1/object/public/avatars/${path}`;
}
