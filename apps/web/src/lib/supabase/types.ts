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
          user_id: string
          model_url?: string
          thumbnail_url?: string
          medium_url?: string
          og_title?: string
          og_description?: string
          og_image_url?: string
          seo_slug: string
          is_public: boolean
          view_count: number
          likes: number
          ai_features_json?: any
          generation_params?: any
        }
        Insert: {
          id?: string
          created_at?: string
          image_id: string
          user_id: string
          model_url?: string
          thumbnail_url?: string
          medium_url?: string
          og_title?: string
          og_description?: string
          og_image_url?: string
          seo_slug: string
          is_public?: boolean
          view_count?: number
          likes?: number
          ai_features_json?: any
          generation_params?: any
        }
        Update: {
          id?: string
          created_at?: string
          image_id?: string
          user_id?: string
          model_url?: string
          thumbnail_url?: string
          medium_url?: string
          og_title?: string
          og_description?: string
          og_image_url?: string
          seo_slug?: string
          is_public?: boolean
          view_count?: number
          likes?: number
          ai_features_json?: any
          generation_params?: any
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