/**
 * Type definitions for AI-generated responses
 */

export interface ImageFeature {
  feature_name: string
  feature_value: string
  confidence: number
  exaggeration_factor: number
}

export interface ImageAnalysisResult {
  features: ImageFeature[]
  character_style: 'cartoon' | 'realistic' | 'anime' | 'pixar'
  dominant_color: string
  personality_traits: string[]
  gender: 'male' | 'female' | 'non-binary' | 'unknown'
  age_range: 'child' | 'teen' | 'young_adult' | 'adult' | 'senior'
}

export interface RoastContent {
  title: string
  roast_text: string
  punchline: string
  figurine_name: string
}

export interface GenerationParams extends ImageAnalysisResult {
  roast_content: RoastContent
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  generatedAt?: string
  composite_og_url?: string
}

export interface Character {
  id: string
  user_id: string | null
  anon_id: string | null
  original_image_url: string
  generated_image_url: string | null
  generation_params: GenerationParams
  og_title: string
  og_description: string
  public: boolean
  views_count: number
  created_at: string
  updated_at: string
  short_code?: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  description: string
  popular?: boolean
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  description: string
  balance_after: number
  created_at: string
}