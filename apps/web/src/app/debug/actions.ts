'use server';

import { getCharacterBySlug } from '@roast-me/database';

export async function debugCharacter(slug: string) {
  try {
    console.log(`🔍 Investigating character with slug: ${slug}`);
    
    const character = await getCharacterBySlug(slug);
    
    if (!character) {
      return {
        error: 'Character not found',
        slug,
        details: null
      };
    }
    
    // Extract key information about the character
    const details = {
      id: character.id,
      created_at: character.created_at,
      user_id: character.user_id,
      model_url: character.model_url,
      og_image_url: character.og_image_url,
      is_public: character.is_public,
      generation_params: character.generation_params,
      ai_features_json: character.ai_features_json,
      image: character.image ? {
        id: character.image.id,
        original_url: character.image.original_url,
        upload_path: character.image.upload_path
      } : null
    };
    
    console.log('Character details:', JSON.stringify(details, null, 2));
    
    return {
      success: true,
      character: details,
      status: details.generation_params?.status || 'Unknown'
    };
    
  } catch (error) {
    console.error('Debug error:', error);
    return {
      error: 'Investigation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}