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

class AuthStore {
  session = $state<Session | null>(null);
  user = $state<User | null>(null);
  loading = $state(true);
  initialized = false;
  client: EnergizeSupabaseClient | null = null;
  isAdmin = $state(false);
  isCrew = $state(false);
  adminChecked = $state(false);

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
      void this.checkAdmin();
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      void this.checkAdmin();
    });
  }

  async checkAdmin(): Promise<void> {
    if (!this.client || !this.user) {
      this.isAdmin = false;
      this.isCrew = false;
      this.adminChecked = true;
      return;
    }
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('role')
        .eq('id', this.user.id)
        .maybeSingle();
      if (error && error.code !== '42703') throw error;
      this.isAdmin = data?.role === 'admin';
      this.isCrew = data?.role === 'crew' || data?.role === 'admin';
    } catch (err) {
      console.warn('[auth] checkAdmin failed (Migration 0005 nicht da?)', err);
      this.isAdmin = false;
      this.isCrew = false;
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
    await this.client.auth.signOut();
  }
}

export const auth = new AuthStore();
