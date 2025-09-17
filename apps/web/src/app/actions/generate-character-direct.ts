'use server';

import { saveCharacter, uploadImage, saveImageRecord } from '@roast-me/database';
import { generateCharacterImage, createSEOSlug, createBeforeAfterComposite, generateOGMetadata } from '@roast-me/ai';

export async function generateCharacterDirectly(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    
    if (!file && !imageUrl) {
      return { error: 'No image provided' };
    }

    // Generate demo user ID
    const userId = 'demo-user-' + Date.now();
    
    // Upload image to storage
    let imageRecord: any = null;
    let finalImageUrl: string = '';
    
    if (file) {
      const uploadResult = await uploadImage(file, userId);
      if (!uploadResult) {
        return { error: 'Failed to upload image' };
      }
      
      finalImageUrl = uploadResult.url;
      
      // Save image record to database
      imageRecord = await saveImageRecord({
        user_id: userId,
        file_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
      
      // Save URL-based image record  
      imageRecord = await saveImageRecord({
        user_id: userId,
        file_url: imageUrl,
        file_name: 'url-image',
        file_size: 0,
        mime_type: 'image/unknown',
      });
    }

    if (!imageRecord) {
      return { error: 'Failed to save image record' };
    }

    // Create mock analysis data for character generation (simplified)
    const mockAnalysis = {
      character_style: 'Cartoon',
      dominant_color: '#6B73FF',
      personality_traits: ['Funny', 'Exaggerated', 'Unique']
    };

    // Create mock features for character generation
    const mockFeatures = [
      {
        feature_name: 'Face',
        feature_value: 'Distinctive facial features',
        confidence: 8,
        exaggeration_factor: 6,
      },
      {
        feature_name: 'Expression',
        feature_value: 'Unique expression and character',
        confidence: 9,
        exaggeration_factor: 7,
      },
      {
        feature_name: 'Style',
        feature_value: 'Personal style and appearance',
        confidence: 7,
        exaggeration_factor: 5,
      }
    ];

    // Generate OG metadata
    const ogMetadata = generateOGMetadata({
      character_style: mockAnalysis.character_style,
      dominant_color: mockAnalysis.dominant_color,
      personality_traits: mockAnalysis.personality_traits,
      features: mockFeatures,
      gender: 'unknown',
      age_range: 'adult'
    }, mockFeatures);
    
    // Create SEO-friendly slug
    const seoSlug = createSEOSlug(mockFeatures, mockAnalysis.character_style);

    // Create JSON features data for storage
    const aiFeatures = {
      features: mockFeatures,
      character_style: mockAnalysis.character_style,
      dominant_color: mockAnalysis.dominant_color,
      personality_traits: mockAnalysis.personality_traits,
      analysis_timestamp: new Date().toISOString(),
      ai_model: 'direct-generation'
    };

    // Create character record with pending status
    const character = await saveCharacter({
      image_id: imageRecord.id,
      user_id: userId,
      model_url: null, // Will be updated after generation
      og_title: ogMetadata.title,
      og_description: ogMetadata.description,
      og_image_url: null, // Will be updated after generation
      seo_slug: seoSlug,
      ai_features_json: aiFeatures,
      generation_params: {
        style: mockAnalysis.character_style,
        color: mockAnalysis.dominant_color,
        personality: mockAnalysis.personality_traits,
        og_image_alt: ogMetadata.imageAlt,
        status: 'generating',
      },
    });

    if (!character) {
      return { error: 'Failed to create character record' };
    }

    // Start background image generation
    generateCharacterImageInBackground({
      characterId: (character as any).id,
      imageUrl: finalImageUrl,
      mockAnalysis,
      mockFeatures: aiFeatures.features
    }).catch(console.error);

    return {
      success: true,
      character,
      seoSlug,
    };
  } catch (error) {
    console.error('Error generating character directly:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate character' 
    };
  }
}

// Background image generation function
async function generateCharacterImageInBackground({
  characterId,
  imageUrl,
  mockAnalysis,
  mockFeatures
}: {
  characterId: string;
  imageUrl: string;
  mockAnalysis: any;
  mockFeatures: any[];
}) {
  try {
    console.log('Starting direct background image generation for character:', characterId);
    
    // Generate character image using Gemini 2.5 Flash Image
    const generatedImageUrl = await generateCharacterImage(mockFeatures, mockAnalysis, []);
    console.log('Direct character image generated successfully:', generatedImageUrl);
    
    let compositeOGImageUrl: string | null = null;
    
    // Create before/after composite image URL for OG sharing
    if (generatedImageUrl) {
      console.log('Creating before/after composite image URL...');
      compositeOGImageUrl = createBeforeAfterComposite(
        imageUrl,
        typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original,
        {
          title: mockAnalysis.character_style.toUpperCase() + ' CHARACTER',
          features: mockFeatures.map((f: any) => f.feature_name)
        }
      );
      console.log('Composite OG image URL created successfully');
    }

    // Update character with generated image and completed status
    const { updateCharacter } = await import('@roast-me/database');
    const updateResult = await updateCharacter(characterId, {
      model_url: generatedImageUrl ? (typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original) : null,
      thumbnail_url: generatedImageUrl && typeof generatedImageUrl !== 'string' ? generatedImageUrl.thumbnail : null,
      medium_url: generatedImageUrl && typeof generatedImageUrl !== 'string' ? generatedImageUrl.medium : null,
      og_image_url: compositeOGImageUrl || (generatedImageUrl ? (typeof generatedImageUrl === 'string' ? generatedImageUrl : generatedImageUrl.original) : null),
      generation_params: {
        ...mockAnalysis,
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
    const { updateCharacter } = await import('@roast-me/database');
    await updateCharacter(characterId, {
      generation_params: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date().toISOString(),
      },
    }).catch(console.error);
  }
}