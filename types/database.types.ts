/**
 * Hand-authored to match supabase/migrations/0001_init_schema.sql exactly.
 * Once your Supabase project is linked, regenerate the authoritative version with:
 *   npm run supabase:types
 * (requires the Supabase CLI logged in and linked — see README.md)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "applicant" | "employer" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "pending_verification" | "deleted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: AccountStatus;
          permissions: Json;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: AccountStatus;
          permissions?: Json;
          deleted_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          status?: AccountStatus;
          deleted_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: never; // insert only via log_audit_event() RPC
        Update: never;
      };
    };
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_permission: {
        Args: { perm: string };
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
      admin_update_profile_role: {
        Args: { p_target_user_id: string; p_new_role: UserRole };
        Returns: void;
      };
    };
  };
}
