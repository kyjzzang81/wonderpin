export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WonderMissionStatus = 'draft' | 'published' | 'archived';
export type WonderpinAdminRole = 'content_manager' | 'super_admin';
export type WonderMissionAssetKind = 'thumbnail' | 'body';

export interface Database {
  public: {
    Tables: {
      admin_user_roles: {
        Row: {
          user_id: string;
          role: WonderpinAdminRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role: WonderpinAdminRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: WonderpinAdminRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wonder_missions: {
        Row: {
          id: string;
          title: string;
          recommended_age: string;
          thumbnail_path: string | null;
          content: string;
          status: WonderMissionStatus;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          recommended_age: string;
          thumbnail_path?: string | null;
          content: string;
          status?: WonderMissionStatus;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          recommended_age?: string;
          thumbnail_path?: string | null;
          content?: string;
          status?: WonderMissionStatus;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wonder_mission_assets: {
        Row: {
          id: string;
          mission_id: string;
          object_path: string;
          kind: WonderMissionAssetKind;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          object_path: string;
          kind: WonderMissionAssetKind;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          object_path?: string;
          kind?: WonderMissionAssetKind;
          original_name?: string;
          mime_type?: string;
          size_bytes?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_wonderpin_admin: {
        Args: { allowed_roles?: WonderpinAdminRole[] };
        Returns: boolean;
      };
    };
    Enums: {
      wonder_mission_status: WonderMissionStatus;
      wonderpin_admin_role: WonderpinAdminRole;
      wonder_mission_asset_kind: WonderMissionAssetKind;
    };
    CompositeTypes: Record<string, never>;
  };
}
