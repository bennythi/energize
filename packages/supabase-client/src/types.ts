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
          phone: string | null;
          birthdate: string | null;
          postal_code: string | null;
          country: string;
          festivals_attended: number;
          festivals_attended_editions: string[];
          locale: 'de' | 'en' | null;
          push_token: string | null;
          avatar_path: string | null;
          is_crew: boolean;
          crew_roles: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          handle?: string | null;
          role?: 'user' | 'admin';
          phone?: string | null;
          birthdate?: string | null;
          postal_code?: string | null;
          country?: string;
          festivals_attended?: number;
          festivals_attended_editions?: string[];
          locale?: 'de' | 'en' | null;
          push_token?: string | null;
          avatar_path?: string | null;
          is_crew?: boolean;
          crew_roles?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          handle?: string | null;
          role?: 'user' | 'admin';
          phone?: string | null;
          birthdate?: string | null;
          postal_code?: string | null;
          country?: string;
          festivals_attended?: number;
          festivals_attended_editions?: string[];
          locale?: 'de' | 'en' | null;
          push_token?: string | null;
          avatar_path?: string | null;
          is_crew?: boolean;
          crew_roles?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      crew_availability: {
        Row: {
          id: string;
          user_id: string;
          start_at: string;
          end_at: string;
          kind: 'all_day' | 'window';
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_at: string;
          end_at: string;
          kind: 'all_day' | 'window';
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_at?: string;
          end_at?: string;
          kind?: 'all_day' | 'window';
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crew_equipment_requests: {
        Row: {
          id: string;
          user_id: string;
          event_day: string;
          equipment: 'razor' | 'headphones' | 'inear';
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_day: string;
          equipment: 'razor' | 'headphones' | 'inear';
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_day?: string;
          equipment?: 'razor' | 'headphones' | 'inear';
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          category: 'account' | 'ticket' | 'cashless' | 'wall' | 'tech' | 'other' | null;
          status: 'open' | 'in_progress' | 'answered' | 'closed';
          created_at: string;
          updated_at: string;
          last_admin_reply_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          category?: 'account' | 'ticket' | 'cashless' | 'wall' | 'tech' | 'other' | null;
          status?: 'open' | 'in_progress' | 'answered' | 'closed';
          created_at?: string;
          updated_at?: string;
          last_admin_reply_at?: string | null;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          category?: 'account' | 'ticket' | 'cashless' | 'wall' | 'tech' | 'other' | null;
          status?: 'open' | 'in_progress' | 'answered' | 'closed';
          created_at?: string;
          updated_at?: string;
          last_admin_reply_at?: string | null;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_staff: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_staff?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string;
          body?: string;
          is_staff?: boolean;
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
    Views: {
      profiles_public: {
        Row: {
          id: string;
          display_name: string | null;
          handle: string | null;
          country: string;
          role: 'user' | 'admin';
          is_crew: boolean;
          festivals_attended: number;
          avatar_path: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_crew: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_list_users: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          email: string;
          display_name: string | null;
          handle: string | null;
          role: 'user' | 'admin';
          phone: string | null;
          birthdate: string | null;
          postal_code: string | null;
          country: string;
          festivals_attended: number;
          festivals_attended_editions: string[];
          created_at: string;
          email_confirmed_at: string | null;
          last_sign_in_at: string | null;
        }>;
      };
      admin_set_role: {
        Args: { target_user_id: string; new_role: 'user' | 'admin' };
        Returns: void;
      };
      admin_set_crew_role: {
        Args: { target_user_id: string; make_crew: boolean; roles?: string[] };
        Returns: void;
      };
      admin_list_crew: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          email: string;
          display_name: string | null;
          handle: string | null;
          role: 'user' | 'admin';
          is_crew: boolean;
          crew_roles: string[];
          avatar_path: string | null;
          created_at: string;
        }>;
      };
      crew_list_members: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          display_name: string | null;
          handle: string | null;
          role: 'user' | 'admin';
          is_crew: boolean;
          crew_roles: string[];
          avatar_path: string | null;
        }>;
      };
      admin_delete_user: {
        Args: { target_user_id: string };
        Returns: void;
      };
      admin_close_ticket: {
        Args: { target_ticket_id: string };
        Returns: void;
      };
      admin_reopen_ticket: {
        Args: { target_ticket_id: string };
        Returns: void;
      };
      admin_list_open_tickets: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          subject: string;
          category: string | null;
          status: 'open' | 'in_progress' | 'answered' | 'closed';
          created_at: string;
          updated_at: string;
          last_admin_reply_at: string | null;
          user_id: string;
          user_email: string;
          user_display_name: string | null;
          message_count: number;
          unanswered_age_hours: number;
        }>;
      };
      community_locations: {
        Args: Record<string, never>;
        Returns: Array<{
          country: string;
          region: string;
          count: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
