'use server';

import { analyzeImageFeatures, calculateCharacterParameters } from '@roast-me/ai';

export async function analyzeImageSimple(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    
    if (!file && !imageUrl) {
      return { error: 'No image provided' };
    }

    let finalImageUrl: string;

    // Handle file upload or URL
    if (file) {
      console.log('Converting file to data URL...');
      // Convert file to data URL for AI analysis (no database storage)
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      finalImageUrl = `data:${file.type};base64,${base64}`;
    } else if (imageUrl) {
      console.log('Using image URL...');
      finalImageUrl = imageUrl;
    } else {
      return { error: 'No valid image source' };
    }

    // Analyze image with AI
    console.log('Analyzing image with AI...');
    const analysis = await analyzeImageFeatures(finalImageUrl);

    // Calculate character parameters
    const characterParams = calculateCharacterParameters(analysis.features);

    return {
      success: true,
      features: analysis.features,
      params: characterParams,
      analysis,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to process image' 
    };
  }
}