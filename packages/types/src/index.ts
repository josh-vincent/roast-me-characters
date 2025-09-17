export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageUpload {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AIFeature {
  id: string;
  image_id: string;
  feature_name: string;
  feature_value: string;
  confidence: number;
  exaggeration_factor: number;
}

export interface Character3D {
  id: string;
  image_id: string;
  user_id: string;
  model_url?: string;
  thumbnail_url?: string;
  features: AIFeature[];
  generation_params: Record<string, any>;
  created_at: string;
  shares: number;
  likes: number;
}

export interface CharacterShare {
  id: string;
  character_id: string;
  share_url: string;
  expires_at?: string;
  created_at: string;
}

export type ProcessingStatus = 
  | 'uploading'
  | 'analyzing'
  | 'generating'
  | 'rendering'
  | 'complete'
  | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  message?: string;
  error?: string;
}