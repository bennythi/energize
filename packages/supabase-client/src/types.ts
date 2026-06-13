/**
 * Supabase Database Types — manuell gepflegt bis Supabase-Projekt steht.
 *
 * Sobald das Supabase-Projekt angelegt + Schema migriert ist, kommt hier:
 *   supabase gen types typescript --project-id <ID> --schema public > types.gen.ts
 *
 * Das Schema spiegelt den Plan in plans/du-bist-im-plan-mode-piped-bentley.md,
 * Sektion 4 wider:
 *   profiles, favorites, posts, post_likes, reports
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          handle: string | null;
          role: 'user' | 'admin';
          locale: 'de' | 'en' | null;
          push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          handle?: string | null;
          role?: 'user' | 'admin';
          locale?: 'de' | 'en' | null;
          push_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          handle?: string | null;
          role?: 'user' | 'admin';
          locale?: 'de' | 'en' | null;
          push_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          followee_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          user_id: string;
          artist_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          artist_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          artist_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_path: string;
          caption: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_path: string;
          caption?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_path?: string;
          caption?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          edition: string;
          rating: number | null;
          liked: string | null;
          disliked: string | null;
          improvements: string | null;
          would_return: 'yes' | 'maybe' | 'no' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          edition: string;
          rating?: number | null;
          liked?: string | null;
          disliked?: string | null;
          improvements?: string | null;
          would_return?: 'yes' | 'maybe' | 'no' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          edition?: string;
          rating?: number | null;
          liked?: string | null;
          disliked?: string | null;
          improvements?: string | null;
          would_return?: 'yes' | 'maybe' | 'no' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
