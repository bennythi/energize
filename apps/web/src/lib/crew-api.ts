import { auth } from '$lib/auth.svelte';

/** Crew-Mitglied, wie /api/crew/members es liefert. */
export interface CrewMember {
  id: string;
  display_name: string;
  handle: string;
  role: 'user' | 'admin';
  crew_roles: string[];
}

/** User-Zeile fuer die Admin-Listen (/api/admin/users, /api/admin/crew). */
export interface AdminUser extends CrewMember {
  email: string;
  created: string;
  is_crew: boolean;
}

export type PermissionLevel = 'read' | 'write' | 'delete';

export interface PermissionsOverview {
  resources: { slug: string; label: string; module: string; sort_order: number }[];
  rolePermissions: { role: string; resource: string; level: PermissionLevel }[];
  userPermissions: { user: string; resource: string; level: PermissionLevel }[];
}

function pb() {
  if (!auth.pb) throw new Error('Backend ist nicht bereit.');
  return auth.pb;
}

/** Anzeigename mit Fallback auf Handle bzw. gekuerzte ID. */
export function memberName(m: Pick<CrewMember, 'display_name' | 'handle' | 'id'> | undefined) {
  if (!m) return 'Unbekannt';
  return m.display_name || (m.handle ? `@${m.handle}` : `User ${m.id.slice(0, 6)}`);
}

export async function listCrewMembers(): Promise<CrewMember[]> {
  const res = await pb().send<{ items: CrewMember[] }>('/api/crew/members', { method: 'GET' });
  return res.items;
}

export async function adminListUsers(q = ''): Promise<AdminUser[]> {
  const res = await pb().send<{ items: AdminUser[] }>('/api/admin/users', {
    method: 'GET',
    query: q ? { q } : undefined,
  });
  return res.items;
}

export async function adminListCrew(): Promise<AdminUser[]> {
  const res = await pb().send<{ items: AdminUser[] }>('/api/admin/crew', { method: 'GET' });
  return res.items;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await pb().send(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

export async function adminSetFlags(
  userId: string,
  patch: { role?: 'user' | 'admin'; is_crew?: boolean; crew_roles?: string[] },
): Promise<void> {
  await pb().send('/api/admin/set-flags', { method: 'POST', body: { userId, ...patch } });
}

/** Startpasswort setzen (Admin). */
export async function adminSetPassword(userId: string, password: string): Promise<void> {
  await pb().send('/api/admin/set-password', { method: 'POST', body: { userId, password } });
}

/** Gut lesbares Zufallspasswort (ohne verwechselbare Zeichen). */
export function generatePassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function adminPermissions(): Promise<PermissionsOverview> {
  return pb().send<PermissionsOverview>('/api/admin/permissions', { method: 'GET' });
}

/** level null => Recht entfernen. */
export async function adminSetRolePermission(
  role: string,
  resource: string,
  level: PermissionLevel | null,
): Promise<void> {
  await pb().send('/api/admin/role-permission', {
    method: 'POST',
    body: { role, resource, level },
  });
}

/** level null => Override entfernen. */
export async function adminSetUserPermission(
  userId: string,
  resource: string,
  level: PermissionLevel | null,
): Promise<void> {
  await pb().send('/api/admin/user-permission', {
    method: 'POST',
    body: { userId, resource, level },
  });
}

/** Fehlertext aus einem Pocketbase-ClientResponseError ziehen. */
export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { message?: string }; message?: string; status?: number };
  if (e?.status === 403) return 'Dafuer fehlt dir die Berechtigung.';
  return e?.response?.message || fallback;
}
