import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import {
  createSupabaseClient,
  type EnergizeSupabaseClient,
  type Session,
  type User,
} from '@energize/supabase-client';

const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY;

export const isAuthConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type PermissionLevel = 'read' | 'write' | 'delete';

const LEVEL_RANK: Record<PermissionLevel, number> = { read: 1, write: 2, delete: 3 };

interface ViewAsState {
  userId: string;
  displayName: string;
  email: string;
  realIsAdmin: boolean;
  realIsCrew: boolean;
  realPermissions: Record<string, PermissionLevel>;
}

const VIEW_AS_KEY = 'energize.viewAsUserId';

class AuthStore {
  session = $state<Session | null>(null);
  user = $state<User | null>(null);
  loading = $state(true);
  initialized = false;
  client: EnergizeSupabaseClient | null = null;
  isAdmin = $state(false);
  isCrew = $state(false);
  adminChecked = $state(false);
  permissions = $state<Record<string, PermissionLevel>>({});
  viewAs = $state<ViewAsState | null>(null);

  canRead(resource: string): boolean {
    return this.hasLevel(resource, 'read');
  }
  canWrite(resource: string): boolean {
    return this.hasLevel(resource, 'write');
  }
  canDelete(resource: string): boolean {
    return this.hasLevel(resource, 'delete');
  }
  hasLevel(resource: string, required: PermissionLevel): boolean {
    if (this.isAdmin) return true;
    const granted = this.permissions[resource];
    if (!granted) return false;
    return LEVEL_RANK[granted] >= LEVEL_RANK[required];
  }

  init() {
    if (!browser || this.initialized) return;
    this.initialized = true;

    if (!isAuthConfigured) {
      this.loading = false;
      return;
    }

    this.client = createSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    this.client.auth.getSession().then(({ data }) => {
      this.session = data.session;
      this.user = data.session?.user ?? null;
      this.loading = false;
      void this.checkAdmin().then(() => this.restoreViewAs());
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      void this.checkAdmin().then(() => this.restoreViewAs());
    });
  }

  async checkAdmin(): Promise<void> {
    if (!this.client || !this.user) {
      this.isAdmin = false;
      this.isCrew = false;
      this.permissions = {};
      this.adminChecked = true;
      return;
    }
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('role, is_crew')
        .eq('id', this.user.id)
        .maybeSingle();
      if (error && error.code !== '42703') throw error;
      this.isAdmin = data?.role === 'admin';
      this.isCrew = this.isAdmin || data?.is_crew === true;

      // Permissions laden, sobald wir wissen dass der User Crew ist.
      // Admin bekommt vom RPC synthetische delete-Eintraege fuer alle Resources.
      if (this.isCrew) {
        const { data: perms } = await this.client.rpc('crew_my_permissions');
        const next: Record<string, PermissionLevel> = {};
        for (const p of perms ?? []) {
          next[p.resource_slug] = p.level;
        }
        this.permissions = next;
      } else {
        this.permissions = {};
      }
    } catch (err) {
      console.warn('[auth] checkAdmin failed (Migration 0005 nicht da?)', err);
      this.isAdmin = false;
      this.isCrew = false;
      this.permissions = {};
    } finally {
      this.adminChecked = true;
    }
  }

  async signInWithMagicLink(email: string, locale: 'de' | 'en' = 'de'): Promise<void> {
    if (!this.client) throw new Error('Auth ist nicht initialisiert');
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        data: { locale },
      },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    if (!this.client) return;
    this.exitViewAs();
    await this.client.auth.signOut();
  }

  async restoreViewAs(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.isAdmin || this.viewAs) return;
    const stored = localStorage.getItem(VIEW_AS_KEY);
    if (stored) {
      await this.enterViewAs(stored);
    }
  }

  async enterViewAs(targetUserId: string): Promise<void> {
    if (!this.client || !this.isAdmin) return;
    try {
      const [profileRes, permsRes] = await Promise.all([
        this.client.rpc('admin_view_user_profile', { target_user_id: targetUserId }),
        this.client.rpc('admin_view_user_permissions', { target_user_id: targetUserId }),
      ]);
      const profile = profileRes.data?.[0];
      if (!profile) throw new Error('User nicht gefunden');

      // Realen Status sichern
      const real: ViewAsState = {
        userId: targetUserId,
        displayName: profile.display_name ?? profile.email,
        email: profile.email,
        realIsAdmin: this.isAdmin,
        realIsCrew: this.isCrew,
        realPermissions: { ...this.permissions },
      };
      this.viewAs = real;

      // UI-State auf Target umstellen
      this.isAdmin = profile.role === 'admin';
      this.isCrew = this.isAdmin || profile.is_crew === true;
      const nextPerms: Record<string, PermissionLevel> = {};
      for (const p of permsRes.data ?? []) {
        nextPerms[p.resource_slug] = p.level;
      }
      this.permissions = nextPerms;

      if (typeof window !== 'undefined') {
        localStorage.setItem(VIEW_AS_KEY, targetUserId);
      }
    } catch (err) {
      console.error('[auth] enterViewAs failed', err);
      this.viewAs = null;
    }
  }

  exitViewAs(): void {
    if (!this.viewAs) return;
    this.isAdmin = this.viewAs.realIsAdmin;
    this.isCrew = this.viewAs.realIsCrew;
    this.permissions = this.viewAs.realPermissions;
    this.viewAs = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(VIEW_AS_KEY);
    }
  }
}

export const auth = new AuthStore();
