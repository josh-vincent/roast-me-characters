import { supabase } from './client';
import type { ImageUpload, AIFeature } from '@roast-me/types';
import type { 
  ImageUploadInsert, 
  AIFeatureInsert, 
  Character3DInsert,
  Character3D,
  Character3DUpdate
} from './types';

export async function uploadImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  try {
    // Create a client with service role for storage operations
    const { createServerClient } = await import('./client');
    const storageClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    if (!storageClient) {
      console.error('Failed to create storage client');
      return null;
    }
    
    const { data, error } = await storageClient.storage
      .from('roast-me-ai')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = storageClient.storage
      .from('roast-me-ai')
      .getPublicUrl(fileName);
    
    return { url: publicUrl, path: fileName };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
}

// Interface for optimized image upload results
interface OptimizedImageUrls {
  original: string;
  thumbnail: string;
  medium: string;
  paths: {
    original: string;
    thumbnail: string;
    medium: string;
  };
}

export async function uploadOptimizedImage(
  imageBuffer: Buffer, 
  userId: string, 
  baseFileName: string = 'generated-character'
): Promise<OptimizedImageUrls | null> {
  try {
    // Create a client with service role for storage operations
    const { createServerClient } = await import('./client');
    const storageClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    if (!storageClient) {
      console.error('Failed to create storage client');
      return null;
    }

    const timestamp = Date.now();
    const basePath = `${userId}/${timestamp}`;
    
    // For now, we'll upload the original image and use Supabase's built-in transformations
    // Later we can add Sharp for more control over optimization
    
    // Upload original image
    const originalFileName = `${basePath}-original.png`;
    const { data: originalData, error: originalError } = await storageClient.storage
      .from('roast-me-ai')
      .upload(originalFileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year cache
      });

    if (originalError) {
      console.error('Error uploading original image:', originalError);
      return null;
    }

    // Get public URLs with Supabase transformations
    const { data: { publicUrl: originalUrl } } = storageClient.storage
      .from('roast-me-ai')
      .getPublicUrl(originalFileName);

    // Use Supabase's built-in image transformations for optimized versions
    const { data: { publicUrl: thumbnailUrl } } = storageClient.storage
      .from('roast-me-ai')
      .getPublicUrl(originalFileName, {
        transform: {
          width: 150,
          height: 150,
          resize: 'cover',
          quality: 80
        }
      });

    const { data: { publicUrl: mediumUrl } } = storageClient.storage
      .from('roast-me-ai')
      .getPublicUrl(originalFileName, {
        transform: {
          width: 400,
          height: 400,
          resize: 'cover',
          quality: 85
        }
      });

    console.log('Successfully uploaded optimized images:', {
      original: originalUrl,
      thumbnail: thumbnailUrl,
      medium: mediumUrl
    });

    return {
      original: originalUrl,
      thumbnail: thumbnailUrl,
      medium: mediumUrl,
      paths: {
        original: originalFileName,
        thumbnail: originalFileName, // Same file, different transform
        medium: originalFileName, // Same file, different transform
      }
    };
  } catch (error) {
    console.error('Error in uploadOptimizedImage:', error);
    return null;
  }
}

// Helper function to convert base64 to buffer
export function base64ToBuffer(base64Data: string): Buffer {
  // Remove the data URL prefix if present
  const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Content, 'base64');
}

export async function saveImageRecord(imageData: ImageUploadInsert) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  const { data, error } = await supabase
    .from('roast_me_ai_image_uploads')
    .insert(imageData as any)
    .select()
    .single();
  
  if (error) {
    console.error('Database error:', error);
    return null;
  }
  
  return data;
}

// Updated to store features as JSON metadata instead of normalized table
export async function saveAIFeatures(features: AIFeatureInsert[], analysis?: any): Promise<any[] | null> {
  // Instead of saving to separate table, we'll return the features data
  // to be stored as JSON in the character record
  console.log('Preparing AI features for JSON storage:', features.length, 'features');
  
  // Transform features into the format expected by the character record
  let featuresJson: any = {
    features: features.map(f => ({
      feature_name: f.feature_name,
      feature_value: f.feature_value,
      confidence: f.confidence,
      exaggeration_factor: f.exaggeration_factor,
    })),
    analysis_timestamp: new Date().toISOString(),
    ai_model: 'gemini-1.5-pro'
  };
  
  // Include additional analysis data if provided
  if (analysis) {
    featuresJson = {
      ...featuresJson,
      character_style: analysis.character_style,
      dominant_color: analysis.dominant_color,
      personality_traits: analysis.personality_traits
    };
  }
  
  // Return the formatted data to be stored as JSON
  return featuresJson.features;
}

export async function saveCharacter(character: Character3DInsert) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  const { data, error } = await supabase
    .from('roast_me_ai_characters')
    .insert(character as any)
    .select()
    .single();
  
  if (error) {
    console.error('Database error:', error);
    return null;
  }
  
  return data;
}

export async function getRecentCharacters(limit = 10) {
  try {
    // Check if Supabase client is configured
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    console.log('Querying roast_me_ai_characters table...');

    // Try a more targeted query with only existing columns
    const { data, error } = await supabase
      .from('roast_me_ai_characters')
      .select('id, created_at, model_url, thumbnail_url, is_public, seo_slug, image_id, ai_features_json, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Database error in getRecentCharacters:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }
    
    console.log(`Found ${data?.length || 0} characters in database`);
    
    // If basic query works, try to get the related image data separately
    if (data && data.length > 0) {
      console.log('Fetching related image data...');
      
      // Get image data for each character
      const charactersWithImages = await Promise.all(
        data.map(async (character: any) => {
          if (character.image_id && supabase) {
            try {
              const { data: imageData, error: imageError } = await supabase
                .from('roast_me_ai_image_uploads')
                .select('*')
                .eq('id', character.image_id)
                .single();
              
              if (!imageError && imageData) {
                return {
                  ...character,
                  image: imageData,
                  features: character.ai_features_json?.features || []
                };
              }
            } catch (imageErr) {
              console.error('Error fetching image for character:', character.id, imageErr);
            }
          }
          
          return {
            ...character,
            features: character.ai_features_json?.features || []
          };
        })
      );
      
      return charactersWithImages;
    }
    
    // Transform JSON features back to the expected format
    return data?.map((character: any) => ({
      ...character,
      features: character.ai_features_json?.features || []
    })) || [];
  } catch (error) {
    console.error('Unexpected error in getRecentCharacters:', error);
    return [];
  }
}

export async function getCharacterBySlug(slug: string): Promise<any | null> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  const { data, error } = await supabase
    .from('roast_me_ai_characters')
    .select('*')
    .eq('seo_slug', slug)
    .eq('is_public', true)
    .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully
  
  if (error) {
    console.error('Database error:', error);
    return null;
  }
  
  // Return null if no character found
  if (!data) {
    return null;
  }
  
  // Get image data separately if image_id exists
  let image = null;
  if ((data as any).image_id) {
    try {
      const { data: imageData, error: imageError } = await supabase
        .from('roast_me_ai_image_uploads')
        .select('*')
        .eq('id', (data as any).image_id)
        .single();
      
      if (!imageError && imageData) {
        image = imageData;
      }
    } catch (imageErr) {
      console.error('Error fetching image for character:', (data as any).id, imageErr);
    }
  }
  
  // Transform JSON features back to the expected format
  return {
    ...(data as any),
    image: image,
    features: (data as any).ai_features_json?.features || []
  };
}

export async function getCharacterById(id: string): Promise<any | null> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  const { data, error } = await supabase
    .from('roast_me_ai_characters')
    .select('*')
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully
  
  if (error) {
    console.error('Database error:', error);
    return null;
  }
  
  // Return null if no character found
  if (!data) {
    return null;
  }
  
  // Get image data separately if image_id exists
  let image = null;
  if ((data as any).image_id) {
    try {
      const { data: imageData, error: imageError } = await supabase
        .from('roast_me_ai_image_uploads')
        .select('*')
        .eq('id', (data as any).image_id)
        .single();
      
      if (!imageError && imageData) {
        image = imageData;
      }
    } catch (imageErr) {
      console.error('Error fetching image for character:', (data as any).id, imageErr);
    }
  }
  
  // Transform JSON features back to the expected format
  return {
    ...(data as any),
    image: image,
    features: (data as any).ai_features_json?.features || []
  };
}

export async function incrementViewCount(characterId: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    console.log('Incrementing view count for character:', characterId);

    // Use raw SQL to increment the view count atomically
    const { data, error } = await (supabase as any).rpc('increment_view_count', {
      character_id: characterId
    });

    if (error) {
      // If RPC doesn't exist, fallback to manual increment
      console.log('RPC not available, using fallback increment method');
      
      // First get current view count
      const { data: currentData, error: selectError } = await supabase
        .from('roast_me_ai_characters')
        .select('view_count')
        .eq('id', characterId)
        .single();

      if (selectError) {
        console.error('Error getting current view count:', selectError);
        return false;
      }

      const currentViewCount = (currentData as any)?.view_count || 0;
      
      // Update with incremented value
      const { error: updateError } = await (supabase as any)
        .from('roast_me_ai_characters')
        .update({ view_count: currentViewCount + 1 })
        .eq('id', characterId);

      if (updateError) {
        console.error('Error updating view count:', updateError);
        return false;
      }

      console.log(`View count incremented from ${currentViewCount} to ${currentViewCount + 1}`);
      return true;
    }

    console.log('View count incremented successfully via RPC');
    return true;
  } catch (error) {
    console.error('Unexpected error in incrementViewCount:', error);
    return false;
  }
}

// Short URL functions (placeholder implementation for now)
export async function getShortUrl(shortCode: string): Promise<{ original_url: string; expires_at?: string } | null> {
  try {
    console.log('Getting short URL for:', shortCode);
    // TODO: Implement actual short URL lookup
    return null;
  } catch (error) {
    console.error('Error getting short URL:', error);
    return null;
  }
}

export async function incrementShortUrlClicks(shortCode: string): Promise<boolean> {
  try {
    console.log('Incrementing clicks for short URL:', shortCode);
    // TODO: Implement actual click increment
    return true;
  } catch (error) {
    console.error('Error incrementing short URL clicks:', error);
    return false;
  }
}

// Update character function
export async function updateCharacter(characterId: string, updates: Character3DUpdate): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    const { data, error } = await supabase
      .from('roast_me_ai_characters')
      // @ts-ignore - Supabase type inference issue
      .update(updates)
      .eq('id', characterId)
      .select()
      .single();
    
    if (error) {
      console.error('Database error updating character:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating character:', error);
    return false;
  }
}