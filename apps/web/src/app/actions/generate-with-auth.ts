'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { saveCharacter, uploadImage, saveImageRecord } from '@roast-me/database';
import { generateCharacterImage, createSEOSlug, createBeforeAfterComposite, generateOGMetadata, analyzeImageFeatures } from '@roast-me/ai';
import type { Database } from '@/lib/supabase/types';

export async function generateWithAuth(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    
    if (!file && !imageUrl) {
      return { error: 'No image provided' };
    }

    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
    
    // Get current user (either authenticated or anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = null;

    if (user) {
      // Authenticated user
      userId = user.id;
    } else {
      // Anonymous user - get from cookie
      const anonUserId = cookieStore.get('anon_user_id')?.value;
      if (anonUserId) {
        userId = anonUserId;
      }
    }

    if (!userId) {
      return { error: 'User session not found. Please refresh the page.' };
    }

    // Get user profile and check credits
    const { data: userProfile, error: profileError } = await supabase
      .from('roast_me_ai_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return { error: 'User profile not found. Please refresh the page.' };
    }

    // Check if user has credits or unlimited plan
    if (userProfile.plan === 'free' && userProfile.credits <= 0) {
      return { 
        error: 'No credits remaining', 
        needsCredits: true,
        isAnonymous: userProfile.is_anonymous,
        imagesCreated: userProfile.images_created
      };
    }

    // Upload image to storage and save record
    let imageRecord: any = null;
    let finalImageUrl: string = '';
    
    if (file) {
      const uploadResult = await uploadImage(file, userId);
      if (!uploadResult) {
        return { error: 'Failed to upload image' };
      }
      
      finalImageUrl = uploadResult.url;
      
      imageRecord = await saveImageRecord({
        user_id: userId,
        file_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
      
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

    // Perform AI analysis of the image
    console.log('🔍 Starting AI feature analysis...');
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeImageFeatures(finalImageUrl);
      console.log('✅ AI analysis completed successfully:', aiAnalysis);
    } catch (analysisError) {
      console.error('❌ AI analysis failed, using fallback:', analysisError);
      // Fallback to mock data if AI analysis fails
      aiAnalysis = {
        features: [
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
        ],
        character_style: 'Cartoon',
        dominant_color: '#6B73FF',
        personality_traits: ['Funny', 'Exaggerated', 'Unique'],
        gender: 'unknown' as const,
        age_range: 'adult' as const
      };
    }

    // Generate roast content immediately via API gateway
    console.log('🔥 Generating roast content via API gateway...');
    let roastContent = null;
    try {
      const roastResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generate-roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features: aiAnalysis.features,
          analysis: aiAnalysis,
        }),
      });
      
      if (roastResponse.ok) {
        const roastData = await roastResponse.json();
        if (roastData.success) {
          roastContent = roastData.roast;
          console.log('✅ Roast generated successfully via API gateway:', roastContent);
        }
      }
    } catch (roastError) {
      console.error('❌ API gateway roast generation failed:', roastError);
    }

    // Generate OG metadata (use roast title if available)
    const ogMetadata = generateOGMetadata(aiAnalysis, aiAnalysis.features.map(f => ({ feature_name: f.feature_name, feature_value: f.feature_value })));
    if (roastContent?.title) {
      ogMetadata.title = `${roastContent.title} | Roast Me Characters`;
    }
    
    // Create SEO-friendly slug (use roast content if available)
    const seoSlug = roastContent 
      ? createSEOSlug(aiAnalysis.features.map(f => ({ feature_name: f.feature_name, feature_value: f.feature_value })), roastContent.title)
      : createSEOSlug(aiAnalysis.features.map(f => ({ feature_name: f.feature_name, feature_value: f.feature_value })), aiAnalysis.character_style);

    // Create JSON features data for storage
    const aiFeatures = {
      features: aiAnalysis.features,
      character_style: aiAnalysis.character_style,
      dominant_color: aiAnalysis.dominant_color,
      personality_traits: aiAnalysis.personality_traits,
      analysis_timestamp: new Date().toISOString(),
      ai_model: 'gemini-1.5-pro-vision'
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
        style: aiAnalysis.character_style,
        color: aiAnalysis.dominant_color,
        personality: aiAnalysis.personality_traits,
        og_image_alt: ogMetadata.imageAlt,
        roast_content: roastContent, // Store the roast immediately
        status: 'generating',
      },
    });

    if (!character) {
      return { error: 'Failed to create character record' };
    }

    // Deduct credit and increment images_created ONLY for free plan users
    if (userProfile.plan === 'free') {
      const { error: updateError } = await supabase
        .from('roast_me_ai_users')
        .update({ 
          credits: userProfile.credits - 1,
          images_created: userProfile.images_created + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user credits:', updateError);
        // Don't fail the entire operation, just log the error
      }
    } else {
      // For pro/unlimited users, just increment images_created counter
      const { error: updateError } = await supabase
        .from('roast_me_ai_users')
        .update({ 
          images_created: userProfile.images_created + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user images count:', updateError);
      }
    }

    // Start background image generation with roast content
    generateCharacterImageInBackground({
      characterId: (character as any).id,
      imageUrl: finalImageUrl,
      aiAnalysis,
      features: aiAnalysis.features,
      roastContent
    }).catch(console.error);

    return {
      success: true,
      character,
      seoSlug,
      remainingCredits: userProfile.plan === 'free' ? userProfile.credits - 1 : -1, // -1 indicates unlimited
      newImagesCount: userProfile.images_created + 1,
      showSignupPrompt: userProfile.is_anonymous && (userProfile.images_created + 1) >= 3
    };
  } catch (error) {
    console.error('Error generating character with auth:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate character' 
    };
  }
}

// Background image generation function (same as before)
async function generateCharacterImageInBackground({
  characterId,
  imageUrl,
  aiAnalysis,
  features,
  roastContent
}: {
  characterId: string;
  imageUrl: string;
  aiAnalysis: any;
  features: any[];
  roastContent: any;
}) {
  try {
    console.log('Starting auth-aware background image generation for character:', characterId);
    console.log('Using roast content:', roastContent ? 'Available' : 'None');
    
    // Generate character image using Gemini 2.5 Flash Image with roast content
    const transformedFeatures = features.map(f => ({
      feature_name: f.feature_name,
      feature_value: f.feature_value,
      confidence: f.confidence,
      exaggeration_factor: f.exaggeration_factor
    }));
    const generatedImageUrls = await generateCharacterImage(transformedFeatures, aiAnalysis, [], roastContent, `user-${characterId}`);
    console.log('Auth-aware character image generated successfully:', generatedImageUrls);
    
    let compositeOGImageUrl: string | null = null;
    
    // Create before/after composite image URL for OG sharing
    if (generatedImageUrls) {
      console.log('Creating before/after composite image URL...');
      compositeOGImageUrl = createBeforeAfterComposite(
        imageUrl,
        generatedImageUrls.original,
        {
          title: aiAnalysis.character_style.toUpperCase() + ' ROAST',
          features: features.map((f: any) => f.feature_name)
        }
      );
      console.log('Composite OG image URL created successfully');
    }

    // Update character with generated image and completed status
    const { updateCharacter } = await import('@roast-me/database');
    const updateResult = await updateCharacter(characterId, {
      model_url: generatedImageUrls?.original || null,
      thumbnail_url: generatedImageUrls?.thumbnail || null,
      medium_url: generatedImageUrls?.medium || null,
      og_image_url: compositeOGImageUrl || generatedImageUrls?.original,
      generation_params: {
        ...aiAnalysis,
        status: 'completed',
        composite_og_url: compositeOGImageUrl,
        roast_content: roastContent,
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