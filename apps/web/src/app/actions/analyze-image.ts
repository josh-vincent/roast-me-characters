'use server';

import { analyzeImageFeatures, calculateCharacterParameters, generateCharacterImage, generateOGMetadata, createSEOSlug, createBeforeAfterComposite } from '@roast-me/ai';
import { uploadImage, saveImageRecord, saveAIFeatures, saveCharacter } from '@roast-me/database';
import type { AIFeature } from '@roast-me/types';

export async function analyzeAndGenerateCharacter(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    const roastFeaturesJson = formData.get('roastFeatures') as string | null;
    
    if (!file && !imageUrl) {
      return { error: 'No image provided' };
    }

    // Parse user-selected roast features
    let userRoastFeatures: any[] = [];
    if (roastFeaturesJson) {
      try {
        userRoastFeatures = JSON.parse(roastFeaturesJson);
        console.log('User selected roast features:', userRoastFeatures);
      } catch (error) {
        console.warn('Failed to parse roast features JSON:', error);
      }
    }

    // For demo purposes, using a mock user ID
    const userId = 'demo-user-' + Date.now();
    let finalImageUrl: string;
    let fileName: string;
    let fileSize: number;

    // Handle file upload or URL
    if (file) {
      console.log('Uploading image file...');
      const uploadResult = await uploadImage(file, userId);
      
      if (!uploadResult) {
        return { error: 'Failed to upload image' };
      }
      
      finalImageUrl = uploadResult.url;
      fileName = file.name;
      fileSize = file.size;
    } else if (imageUrl) {
      console.log('Using image URL...');
      finalImageUrl = imageUrl;
      fileName = imageUrl.split('/').pop() || 'image.jpg';
      fileSize = 0; // Unknown for URLs
    } else {
      return { error: 'No valid image source' };
    }

    // Save image record to database
    const imageRecord = await saveImageRecord({
      user_id: userId,
      file_url: finalImageUrl,
      file_name: fileName,
      file_size: fileSize,
      mime_type: file ? file.type : 'image/jpeg',
      status: 'processing'
    });

    if (!imageRecord) {
      return { error: 'Failed to save image record' };
    }

    // Analyze image with AI
    console.log('Analyzing image with AI...');
    const analysis = await analyzeImageFeatures(finalImageUrl);

    // Save AI features (clamp values to fit database constraints)
    const features: Omit<AIFeature, 'id'>[] = analysis.features.map(f => {
      const originalConfidence = f.confidence;
      const normalizedConfidence = Math.min(0.99, Math.max(0.01, f.confidence / 10)); // Convert 1-10 scale to 0.01-0.99 scale
      const clampedExaggeration = Math.min(9.9, Math.max(1, f.exaggeration_factor)); // Clamp 1-9.9 to avoid overflow
      
      console.log(`Feature: ${f.feature_name}, Original confidence: ${originalConfidence}, Normalized: ${normalizedConfidence}, Exaggeration: ${clampedExaggeration}`);
      
      return {
        image_id: (imageRecord as any).id,
        feature_name: f.feature_name,
        feature_value: f.feature_value,
        confidence: normalizedConfidence,
        exaggeration_factor: clampedExaggeration,
      };
    });

    const savedFeatures = await saveAIFeatures(features);
    
    if (!savedFeatures) {
      return { error: 'Failed to save AI features' };
    }

    // Calculate character parameters
    const characterParams = calculateCharacterParameters(analysis.features);

    // Generate OG metadata for sharing
    const ogMetadata = generateOGMetadata(analysis, analysis.features);
    
    // Create SEO-friendly slug
    const seoSlug = createSEOSlug(analysis.features, analysis.character_style);

    // Generate character image using Gemini 2.5 Flash
    console.log('Generating character image with Gemini 2.5 Flash...');
    let generatedImageUrls: { original: string; thumbnail: string; medium: string } | null = null;
    let compositeOGImageUrl: string | null = null;
    
    try {
      generatedImageUrls = await generateCharacterImage(analysis.features, analysis, userRoastFeatures, undefined, userId);
      console.log('Character image generated successfully:', generatedImageUrls);
      
      // Create before/after composite image URL for OG sharing
      if (generatedImageUrls) {
        console.log('Creating before/after composite image URL...');
        compositeOGImageUrl = createBeforeAfterComposite(
          finalImageUrl,
          generatedImageUrls.original,
          {
            title: analysis.character_style.toUpperCase() + ' CHARACTER',
            features: analysis.features.map(f => f.feature_name)
          }
        );
        console.log('Composite OG image URL created successfully');
      }
    } catch (imageError) {
      console.error('Failed to generate character image:', imageError);
      // Continue without generated image - we'll still save the character
    }

    // Save character with enhanced metadata
    const character = await saveCharacter({
      image_id: (imageRecord as any).id,
      user_id: userId,
      model_url: generatedImageUrls?.original || null, // Store the original generated image URL
      thumbnail_url: generatedImageUrls?.thumbnail || null, // Store thumbnail URL
      medium_url: generatedImageUrls?.medium || null, // Store medium URL
      og_title: ogMetadata.title,
      og_description: ogMetadata.description,
      og_image_url: compositeOGImageUrl || generatedImageUrls?.original, // Use composite image for OG
      seo_slug: seoSlug,
      generation_params: {
        ...characterParams,
        style: analysis.character_style,
        color: analysis.dominant_color,
        personality: analysis.personality_traits,
        og_image_alt: ogMetadata.imageAlt,
        composite_og_url: compositeOGImageUrl,
      },
    });

    if (!character) {
      return { error: 'Failed to save character' };
    }

    return {
      success: true,
      character,
      features: savedFeatures,
      params: characterParams,
      analysis,
      generatedImageUrls,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to process image' 
    };
  }
}