'use server';

import { analyzeImageFeatures } from '@roast-me/ai';
import { uploadImage, saveImageRecord } from '@roast-me/database';

export async function analyzeImageOnly(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    
    if (!file && !imageUrl) {
      return { error: 'No image provided' };
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

    return {
      success: true,
      analysis,
      imageRecord: {
        id: (imageRecord as any).id,
        imageUrl: finalImageUrl
      }
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to analyze image' 
    };
  }
}