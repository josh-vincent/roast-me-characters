'use server';

import { getCharacterById } from '@roast-me/database';
import { retryCharacterGeneration } from '@roast-me/ai';

export async function retryCharacterGenerationAction(characterId: string) {
  try {
    // Get the existing character data
    const character = await getCharacterById(characterId);
    
    if (!character) {
      return { error: 'Character not found' };
    }

    // Check if character is in a retryable state
    const currentStatus = character.generation_params?.status;
    if (!['failed', 'retry_failed'].includes(currentStatus)) {
      return { error: 'Character is not in a retryable state' };
    }

    // Extract the AI features and analysis from the character record
    const aiFeatures = character.ai_features_json;
    if (!aiFeatures || !aiFeatures.features) {
      return { error: 'Character missing AI features data' };
    }

    const features = aiFeatures.features;
    const analysis = {
      features: features,
      character_style: aiFeatures.character_style || 'cartoon',
      dominant_color: aiFeatures.dominant_color || 'blue',
      personality_traits: aiFeatures.personality_traits || ['friendly'],
      gender: aiFeatures.gender || 'unknown',
      age_range: aiFeatures.age_range || 'adult'
    };

    // Determine the attempt number
    const previousAttempt = character.generation_params?.attempt || 0;
    const attemptNumber = previousAttempt + 1;

    // Get existing roast content if available
    const existingRoastContent = character.generation_params?.roast_content || null;
    
    // Retry the generation
    const result = await retryCharacterGeneration(
      characterId,
      features,
      analysis,
      [], // No user roast features for now
      attemptNumber,
      existingRoastContent
    );

    if (result.success) {
      return {
        success: true,
        message: `Character regenerated successfully on attempt ${attemptNumber}`,
        imageUrl: result.imageUrl
      };
    } else {
      return {
        error: `Retry attempt ${attemptNumber} failed: ${result.error}`
      };
    }

  } catch (error) {
    console.error('Error in retry character generation action:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to retry character generation'
    };
  }
}