'use server';

import { calculateCharacterParameters, generateCharacterImage, generateOGMetadata, createSEOSlug, createBeforeAfterComposite } from '@roast-me/ai';
import { saveAIFeatures, saveCharacter, updateCharacter } from '@roast-me/database';
import type { AIFeature } from '@roast-me/types';

interface GenerateCharacterInput {
  imageRecordId: string;
  userId: string;
  imageUrl: string;
  analysis: any;
  selectedRoastFeatures: any[];
}

export async function generateCharacterFromAnalysis(input: GenerateCharacterInput) {
  try {
    const { imageRecordId, userId, imageUrl, analysis, selectedRoastFeatures } = input;
    
    // Prepare AI features for JSON storage (no more normalized table)
    const features: Omit<AIFeature, 'id'>[] = analysis.features.map((f: any) => {
      const originalConfidence = f.confidence;
      const clampedConfidence = Math.min(10, Math.max(1, f.confidence)); // Keep 1-10 scale
      const clampedExaggeration = Math.min(9, Math.max(1, f.exaggeration_factor)); // Clamp 1-9
      
      console.log(`Feature: ${f.feature_name}, Original confidence: ${originalConfidence}, Clamped: ${clampedConfidence}, Exaggeration: ${clampedExaggeration}`);
      
      return {
        image_id: imageRecordId,
        feature_name: f.feature_name,
        feature_value: f.feature_value,
        confidence: clampedConfidence,
        exaggeration_factor: clampedExaggeration,
      };
    });

    // Get formatted features for JSON storage
    const savedFeatures = await saveAIFeatures(features, analysis);
    
    if (!savedFeatures) {
      return { error: 'Failed to prepare AI features' };
    }

    // Calculate character parameters
    const characterParams = calculateCharacterParameters(analysis.features);

    // Generate OG metadata for sharing
    const ogMetadata = generateOGMetadata(analysis, analysis.features);
    
    // Create SEO-friendly slug
    const seoSlug = createSEOSlug(analysis.features, analysis.character_style);

    // Create JSON features data for storage
    const aiFeatures = {
      features: features.map(f => ({
        feature_name: f.feature_name,
        feature_value: f.feature_value,
        confidence: f.confidence,
        exaggeration_factor: f.exaggeration_factor,
      })),
      character_style: analysis.character_style,
      dominant_color: analysis.dominant_color,
      personality_traits: analysis.personality_traits,
      analysis_timestamp: new Date().toISOString(),
      ai_model: 'gemini-1.5-pro'
    };

    // Create character record IMMEDIATELY with pending status and JSON features
    const pendingCharacter = await saveCharacter({
      image_id: imageRecordId,
      user_id: userId,
      model_url: null, // Will be updated after generation
      og_title: ogMetadata.title,
      og_description: ogMetadata.description,
      og_image_url: null, // Will be updated after generation
      seo_slug: seoSlug,
      ai_features_json: aiFeatures, // Store features as JSON
      generation_params: {
        ...characterParams,
        style: analysis.character_style,
        color: analysis.dominant_color,
        personality: analysis.personality_traits,
        og_image_alt: ogMetadata.imageAlt,
        status: 'generating', // Track generation status
        selectedRoastFeatures,
      },
    });

    if (!pendingCharacter) {
      return { error: 'Failed to create character record' };
    }

    // Return immediately with character info for redirect
    const result = {
      success: true,
      character: pendingCharacter,
      features: aiFeatures.features, // Return JSON features for compatibility
      params: characterParams,
      analysis,
      seoSlug,
      generatedImageUrl: null, // Will be populated by background generation
    };

    // Start background image generation (don't await)
    generateCharacterImageInBackground({
      characterId: (pendingCharacter as any).id,
      imageUrl,
      analysis,
      selectedRoastFeatures,
      savedFeatures: aiFeatures.features as any[]
    }).catch(console.error);

    return result;
  } catch (error) {
    console.error('Error generating character:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate character' 
    };
  }
}

// Background image generation function
async function generateCharacterImageInBackground({
  characterId,
  imageUrl,
  analysis,
  selectedRoastFeatures,
  savedFeatures
}: {
  characterId: string;
  imageUrl: string;
  analysis: any;
  selectedRoastFeatures: any[];
  savedFeatures: any[];
}) {
  try {
    console.log('Starting background image generation for character:', characterId);
    
    // Generate character image using Gemini 2.5 Flash
    const generatedImageUrl = await generateCharacterImage(analysis.features, analysis, selectedRoastFeatures);
    console.log('Character image generated successfully:', generatedImageUrl);
    
    let compositeOGImageUrl: string | null = null;
    
    // Create before/after composite image URL for OG sharing
    if (generatedImageUrl) {
      console.log('Creating before/after composite image URL...');
      compositeOGImageUrl = createBeforeAfterComposite(
        imageUrl,
        typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original,
        {
          title: analysis.character_style.toUpperCase() + ' CHARACTER',
          features: analysis.features.map((f: any) => f.feature_name)
        }
      );
      console.log('Composite OG image URL created successfully');
    }

    // Update character with generated image and completed status
    const updateResult = await updateCharacter(characterId, {
      model_url: generatedImageUrl ? (typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original) : null,
      thumbnail_url: generatedImageUrl && typeof generatedImageUrl !== 'string' ? generatedImageUrl.thumbnail : null,
      medium_url: generatedImageUrl && typeof generatedImageUrl !== 'string' ? generatedImageUrl.medium : null,
      og_image_url: compositeOGImageUrl || (generatedImageUrl ? (typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original) : null),
      generation_params: {
        ...analysis,
        status: 'completed',
        composite_og_url: compositeOGImageUrl,
        generatedAt: new Date().toISOString(),
      },
    });

    if (updateResult) {
      console.log('Character updated successfully with generated image');
    } else {
      console.error('Failed to update character with generated image');
    }
    
  } catch (error) {
    console.error('Background image generation failed:', error);
    
    // Update character with failed status
    await updateCharacter(characterId, {
      generation_params: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date().toISOString(),
      },
    }).catch(console.error);
  }
}