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
      cashless_registers: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cashless_shifts: {
        Row: {
          id: string;
          register_id: string;
          opened_at: string;
          opened_by_a: string;
          opened_by_b: string;
          closed_at: string | null;
          closed_by_a: string | null;
          closed_by_b: string | null;
          starting_cents: number;
          ending_cents: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          register_id: string;
          opened_at?: string;
          opened_by_a: string;
          opened_by_b: string;
          closed_at?: string | null;
          closed_by_a?: string | null;
          closed_by_b?: string | null;
          starting_cents: number;
          ending_cents?: number | null;
          note?: string | null;
        };
        Update: {
          closed_at?: string | null;
          closed_by_a?: string | null;
          closed_by_b?: string | null;
          ending_cents?: number | null;
          note?: string | null;
        };
        Relationships: [];
      };
      cashless_shift_denominations: {
        Row: {
          id: string;
          shift_id: string;
          kind: 'start' | 'end';
          denomination_cents: number;
          count: number;
        };
        Insert: {
          id?: string;
          shift_id: string;
          kind: 'start' | 'end';
          denomination_cents: number;
          count: number;
        };
        Update: {
          count?: number;
        };
        Relationships: [];
      };
      cashless_movements: {
        Row: {
          id: string;
          shift_id: string;
          kind: 'withdrawal' | 'exchange_in' | 'exchange_out';
          amount_cents: number;
          counterpart_register_id: string | null;
          performed_at: string;
          performed_by_a: string;
          performed_by_b: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          shift_id: string;
          kind: 'withdrawal' | 'exchange_in' | 'exchange_out';
          amount_cents: number;
          counterpart_register_id?: string | null;
          performed_at?: string;
          performed_by_a: string;
          performed_by_b: string;
          note?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      crew_briefings: {
        Row: {
          id: string;
          department: string;
          title: string;
          body: string;
          pinned: boolean;
          updated_at: string;
          updated_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      crew_milestones: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          due_date: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      crew_resources: {
        Row: {
          slug: string;
          label: string;
          description: string | null;
          sort_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      crew_role_permissions: {
        Row: {
          id: string;
          role: string;
          resource_slug: string;
          level: 'read' | 'write' | 'delete';
          created_at: string;
          created_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      crew_user_permissions: {
        Row: {
          id: string;
          user_id: string;
          resource_slug: string;
          level: 'read' | 'write' | 'delete';
          created_at: string;
          created_by: string | null;
        };
        Insert: never;
        Update: never;
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
      is_topup_kassierer: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_cashless_register_upsert: {
        Args: {
          target_id: string | null;
          new_name: string;
          new_location: string | null;
          new_active: boolean;
        };
        Returns: string;
      };
      cashless_shift_summary: {
        Args: { target_shift_id: string };
        Returns: Array<{
          shift_id: string;
          starting_cents: number;
          movement_in_cents: number;
          movement_out_cents: number;
          expected_cents: number;
          ending_cents: number | null;
          difference_cents: number | null;
        }>;
      };
      admin_crew_briefing_upsert: {
        Args: {
          target_id: string | null;
          new_department: string;
          new_title: string;
          new_body: string;
          new_pinned: boolean;
        };
        Returns: string;
      };
      admin_crew_briefing_delete: {
        Args: { target_id: string };
        Returns: void;
      };
      admin_crew_milestone_upsert: {
        Args: {
          target_id: string | null;
          new_title: string;
          new_description: string | null;
          new_category: string;
          new_due_date: string;
        };
        Returns: string;
      };
      admin_crew_milestone_delete: {
        Args: { target_id: string };
        Returns: void;
      };
      crew_milestone_set_completed: {
        Args: { target_id: string; completed: boolean };
        Returns: void;
      };
      admin_view_user_profile: {
        Args: { target_user_id: string };
        Returns: Array<{
          user_id: string;
          email: string;
          display_name: string | null;
          role: 'user' | 'admin';
          is_crew: boolean;
          crew_roles: string[];
        }>;
      };
      admin_view_user_permissions: {
        Args: { target_user_id: string };
        Returns: Array<{
          resource_slug: string;
          level: 'read' | 'write' | 'delete';
        }>;
      };
      crew_can: {
        Args: { resource: string; required_level: string };
        Returns: boolean;
      };
      crew_my_permissions: {
        Args: Record<string, never>;
        Returns: Array<{
          resource_slug: string;
          level: 'read' | 'write' | 'delete';
        }>;
      };
      admin_set_role_permission: {
        Args: {
          role: string;
          resource_slug: string;
          new_level: string | null;
        };
        Returns: void;
      };
      admin_set_user_permission: {
        Args: {
          target_user_id: string;
          resource_slug: string;
          new_level: string | null;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
