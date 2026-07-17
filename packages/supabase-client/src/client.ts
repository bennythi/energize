import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

/**
 * Supabase-Client.
 *
 * Public anon-Key wird im Browser-Bundle ausgeliefert (ist OK — RLS schützt
 * die Daten). Die Werte werden via env-Vars von der Hostumgebung gesetzt:
 *
 *   PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *   PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
 *
 * SvelteKit liest sie über $env/static/public im App-Code (siehe apps/web).
 */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  if (!url) throw new Error('PUBLIC_SUPABASE_URL fehlt');
  if (!anonKey) throw new Error('PUBLIC_SUPABASE_ANON_KEY fehlt');
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

export type EnergizeSupabaseClient = SupabaseClient<Database>;
