export type Database = {
  public: {
    Tables: {
      roast_me_ai_users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email?: string
          google_id?: string
          is_anonymous: boolean
          credits: number
          images_created: number
          plan: 'free' | 'pro' | 'unlimited'
          polar_customer_id?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          google_id?: string
          is_anonymous?: boolean
          credits?: number
          images_created?: number
          plan?: 'free' | 'pro' | 'unlimited'
          polar_customer_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          google_id?: string
          is_anonymous?: boolean
          credits?: number
          images_created?: number
          plan?: 'free' | 'pro' | 'unlimited'
          polar_customer_id?: string
        }
      }
      roast_me_ai_image_uploads: {
        Row: {
          id: string
          created_at: string
          user_id: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          file_url: string
          file_name: string
          file_size: number
          mime_type: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          file_url?: string
          file_name?: string
          file_size?: number
          mime_type?: string
        }
      }
      roast_me_ai_characters: {
        Row: {
          id: string
          created_at: string
          image_id: string
          user_id: string | null
          model_url?: string | null
          thumbnail_url?: string | null
          medium_url?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          seo_slug: string
          is_public: boolean
          view_count: number
          likes: number
          ai_features_json?: any
          generation_params?: any
          session_id?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          image_id: string
          user_id?: string | null
          model_url?: string | null
          thumbnail_url?: string | null
          medium_url?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          seo_slug: string
          is_public?: boolean
          view_count?: number
          likes?: number
          ai_features_json?: any
          generation_params?: any
          session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          image_id?: string
          user_id?: string | null
          model_url?: string | null
          thumbnail_url?: string | null
          medium_url?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          seo_slug?: string
          is_public?: boolean
          view_count?: number
          likes?: number
          ai_features_json?: any
          generation_params?: any
          session_id?: string | null
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
  }
}