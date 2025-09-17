export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roast_me_ai_users: {
        Row: {
          id: string
          email: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roast_me_ai_image_uploads: {
        Row: {
          id: string
          user_id: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          uploaded_at: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Insert: {
          id?: string
          user_id: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
          uploaded_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          uploaded_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
      }
      roast_me_ai_features: {
        Row: {
          id: string
          image_id: string
          feature_name: string
          feature_value: string
          confidence: number | null
          exaggeration_factor: number | null
        }
        Insert: {
          id?: string
          image_id: string
          feature_name: string
          feature_value: string
          confidence?: number | null
          exaggeration_factor?: number | null
        }
        Update: {
          id?: string
          image_id?: string
          feature_name?: string
          feature_value?: string
          confidence?: number | null
          exaggeration_factor?: number | null
        }
      }
      roast_me_ai_characters: {
        Row: {
          id: string
          image_id: string
          user_id: string
          model_url: string | null
          thumbnail_url: string | null
          medium_url: string | null
          generation_params: Json
          ai_features_json: Json | null
          created_at: string
          shares: number
          likes: number
          share_token: string | null
          og_title: string | null
          og_description: string | null
          og_image_url: string | null
          seo_slug: string | null
          is_public: boolean
          view_count: number
        }
        Insert: {
          id?: string
          image_id: string
          user_id: string
          model_url?: string | null
          thumbnail_url?: string | null
          medium_url?: string | null
          generation_params?: Json
          ai_features_json?: Json | null
          created_at?: string
          shares?: number
          likes?: number
          share_token?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          seo_slug?: string | null
          is_public?: boolean
          view_count?: number
        }
        Update: {
          id?: string
          image_id?: string
          user_id?: string
          model_url?: string | null
          thumbnail_url?: string | null
          medium_url?: string | null
          generation_params?: Json
          ai_features_json?: Json | null
          created_at?: string
          shares?: number
          likes?: number
          share_token?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          seo_slug?: string | null
          is_public?: boolean
          view_count?: number
        }
      }
      roast_me_ai_shares: {
        Row: {
          id: string
          character_id: string
          share_url: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          share_url: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          share_url?: string
          expires_at?: string | null
          created_at?: string
        }
      }
      roast_me_ai_waitlist: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          source: 'web' | 'mobile' | 'social'
          is_notified: boolean
          notification_sent_at: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          source?: 'web' | 'mobile' | 'social'
          is_notified?: boolean
          notification_sent_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          source?: 'web' | 'mobile' | 'social'
          is_notified?: boolean
          notification_sent_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for our specific tables
export type User = Database['public']['Tables']['roast_me_ai_users']['Row']
export type UserInsert = Database['public']['Tables']['roast_me_ai_users']['Insert']
export type UserUpdate = Database['public']['Tables']['roast_me_ai_users']['Update']

export type ImageUpload = Database['public']['Tables']['roast_me_ai_image_uploads']['Row']
export type ImageUploadInsert = Database['public']['Tables']['roast_me_ai_image_uploads']['Insert']
export type ImageUploadUpdate = Database['public']['Tables']['roast_me_ai_image_uploads']['Update']

export type AIFeature = Database['public']['Tables']['roast_me_ai_features']['Row']
export type AIFeatureInsert = Database['public']['Tables']['roast_me_ai_features']['Insert']
export type AIFeatureUpdate = Database['public']['Tables']['roast_me_ai_features']['Update']

export type Character3D = Database['public']['Tables']['roast_me_ai_characters']['Row']
export type Character3DInsert = Database['public']['Tables']['roast_me_ai_characters']['Insert']
export type Character3DUpdate = Database['public']['Tables']['roast_me_ai_characters']['Update']

export type CharacterShare = Database['public']['Tables']['roast_me_ai_shares']['Row']
export type CharacterShareInsert = Database['public']['Tables']['roast_me_ai_shares']['Insert']
export type CharacterShareUpdate = Database['public']['Tables']['roast_me_ai_shares']['Update']

export type WaitlistEntry = Database['public']['Tables']['roast_me_ai_waitlist']['Row']
export type WaitlistEntryInsert = Database['public']['Tables']['roast_me_ai_waitlist']['Insert']
export type WaitlistEntryUpdate = Database['public']['Tables']['roast_me_ai_waitlist']['Update']