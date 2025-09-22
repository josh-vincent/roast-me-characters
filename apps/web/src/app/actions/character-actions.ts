'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { analyzeImageFeatures, generateRoast, generateCharacterImage } from '@roast-me/ai'
import { redirect } from 'next/navigation'
import type { ImageAnalysisResult, RoastContent, Character, GenerationParams } from '@/types/ai'

interface CharacterGenerationResult {
  success: boolean
  characterId?: string
  error?: string
  requiresAuth?: boolean
}

/**
 * Main character generation action - handles both authenticated and anonymous users
 */
export async function generateCharacter(formData: FormData): Promise<CharacterGenerationResult> {
  try {
    const supabase = await createClient()
    const file = formData.get('image') as File
    const anonSessionId = formData.get('anonSessionId') as string | null
    
    if (!file || file.size === 0) {
      return { success: false, error: 'No image provided' }
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`
    
    // Analyze the image
    const analysisResult = await analyzeImageFeatures(base64Image) as ImageAnalysisResult
    
    if (!analysisResult?.features || analysisResult.features.length === 0) {
      return { success: false, error: 'Could not analyze image features' }
    }

    // Generate roast content
    const roastContent = await generateRoast(analysisResult.features, analysisResult) as RoastContent
    
    if (!roastContent) {
      return { success: false, error: 'Could not generate roast content' }
    }

    // Generate character ID
    const characterId = crypto.randomUUID()
    const timestamp = Date.now()
    
    // Upload original image
    const originalPath = user 
      ? `user-${user.id}/${timestamp}.webp`
      : `anon-${timestamp}-${characterId.slice(0, 8)}/${timestamp}.webp`
    
    const { error: uploadError } = await supabase.storage
      .from('roast-me-ai')
      .upload(originalPath, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Failed to upload image' }
    }

    // Get public URL
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('roast-me-ai')
      .getPublicUrl(originalPath)

    // Generate SEO slug from roast content
    const seoSlug = `${roastContent.figurine_name || 'character'}-${characterId.slice(0, 8)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Store character in database
    const characterData = {
      id: characterId,
      user_id: user?.id || null,
      image_id: characterId, // Using characterId as image_id for now
      seo_slug: seoSlug,
      model_url: null, // Will be updated after generation
      generation_params: {
        ...analysisResult,
        roast_content: roastContent,
        original_image_url: originalUrl, // Store original URL in params
        status: 'pending'
      },
      og_title: `${roastContent.title} | Roast Me Characters`,
      og_description: roastContent.punchline,
      is_public: true,
      view_count: 0
    }

    const { error: insertError } = await supabase
      .from('roast_me_ai_characters')
      .insert(characterData)
    
    if (insertError) {
      console.error('Database error:', insertError)
      return { success: false, error: 'Failed to save character' }
    }

    // Call Supabase Edge Function for image generation (runs for up to 150 seconds!)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-character-image`
    
    // Fire and forget - edge function will handle everything
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId })
    }).catch(error => {
      console.error('Failed to trigger edge function:', error)
      // Try to update status to failed so user knows
      return (createServiceClient()
        .from('roast_me_ai_characters') as any)
        .update({
          generation_params: {
            ...analysisResult,
            roast_content: roastContent,
            original_image_url: originalUrl,
            status: 'failed',
            error: 'Failed to start image generation'
          }
        })
        .eq('id', characterId)
        .then(({ error: updateError }: any) => {
          if (updateError) console.error('Failed to update status:', updateError);
        });
    })
    
    return { 
      success: true, 
      characterId,
      requiresAuth: !user 
    }
  } catch (error) {
    console.error('Generation error:', error)
    return { success: false, error: 'Failed to generate character' }
  }
}

// Async generation function that runs in background
async function generateCharacterImageBackground(
  features: any[],
  analysis: any,
  roastContent: any,
  characterId: string,
  originalUrl: string
) {
  const supabase = createServiceClient()
  
  try {
    // Add a timestamp to track generation start time
    const startTime = Date.now()
    
    // Generate the character image
    console.log('Async: Calling generateCharacterImage...')
    const result = await generateCharacterImage(
      features,
      analysis,
      [],
      roastContent,
      characterId
    )
    
    const generatedUrl = result?.original || null
    console.log('Async: Image generation result:', generatedUrl ? 'Success' : 'Failed')
    
    // Check if more than 60 seconds have passed (timeout)
    const elapsedTime = Date.now() - startTime
    if (elapsedTime > 60000) {
      console.log('Async: Generation took too long, marking as timeout')
      await (supabase
        .from('roast_me_ai_characters') as any)
        .update({
          generation_params: {
            ...analysis,
            roast_content: roastContent,
            original_image_url: originalUrl,
            status: 'timeout',
            error: 'Generation took longer than 60 seconds'
          }
        })
        .eq('id', characterId)
      return
    }
    
    if (generatedUrl) {
      // Create composite OG URL for sharing
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'
      const ogImageUrl = new URL('/api/og', baseUrl)
      ogImageUrl.searchParams.set('original', originalUrl)
      ogImageUrl.searchParams.set('generated', generatedUrl)
      
      if (roastContent.title) {
        ogImageUrl.searchParams.set('title', roastContent.title)
      }
      if (roastContent.punchline) {
        ogImageUrl.searchParams.set('punchline', roastContent.punchline)
      }
      
      const compositeOgUrl = ogImageUrl.toString()
      
      // Update the character with success
      await (supabase
        .from('roast_me_ai_characters') as any)
        .update({
          model_url: generatedUrl,
          generation_params: {
            ...analysis,
            roast_content: roastContent,
            original_image_url: originalUrl,
            status: 'completed',
            composite_og_url: compositeOgUrl
          }
        })
        .eq('id', characterId)
    } else {
      // Mark as failed if no URL generated
      await (supabase
        .from('roast_me_ai_characters') as any)
        .update({
          generation_params: {
            ...analysis,
            roast_content: roastContent,
            original_image_url: originalUrl,
            status: 'failed',
            error: 'Failed to generate image'
          }
        })
        .eq('id', characterId)
    }
  } catch (error) {
    console.error('Async generation error:', error)
    // Update status to failed
    await (supabase
      .from('roast_me_ai_characters') as any)
      .update({
        generation_params: {
          ...analysis,
          roast_content: roastContent,
          original_image_url: originalUrl,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', characterId)
  }
}

/**
 * Retry character generation for a failed character
 */
export async function retryCharacterGeneration(characterId: string): Promise<CharacterGenerationResult> {
  try {
    const supabase = await createClient()
    
    // Get character data
    const { data: character, error: fetchError } = await supabase
      .from('roast_me_ai_characters')
      .select('*')
      .eq('id', characterId)
      .single()
    
    if (fetchError || !character) {
      return { success: false, error: 'Character not found' }
    }

    const params = character.generation_params as any
    
    // Validate required params
    if (!params || !params.features || !Array.isArray(params.features)) {
      console.error('Invalid generation params for retry:', params)
      return { success: false, error: 'Invalid character data for retry' }
    }
    
    // Retry image generation
    const result = await generateCharacterImage(
      params.features,
      params,
      [],
      params.roast_content,
      character.user_id || character.id
    )
    
    const generatedUrl = result?.original || null
    
    if (!generatedUrl) {
      return { success: false, error: 'Failed to generate character image' }
    }

    // Update database - preserve original_image_url
    const { error: updateError } = await supabase
      .from('roast_me_ai_characters')
      .update({
        model_url: generatedUrl,
        generation_params: {
          ...params,
          original_image_url: params.original_image_url, // Preserve original image URL
          status: 'completed'
        }
      })
      .eq('id', characterId)
    
    if (updateError) {
      return { success: false, error: 'Failed to update character' }
    }

    return { success: true, characterId }
  } catch (error) {
    console.error('Retry error:', error)
    return { success: false, error: 'Failed to retry generation' }
  }
}

/**
 * Get recent characters for the gallery
 */
/**
 * Migrate anonymous characters to authenticated user
 */
export async function migrateAnonymousCharacters(sessionId: string): Promise<{ success: boolean; migratedCount?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false }
    }
    
    // Find all characters with this session ID and no user ID
    const { data: anonymousCharacters, error: fetchError } = await supabase
      .from('roast_me_ai_characters')
      .select('id')
      .eq('session_id', sessionId)
      .is('user_id', null)
    
    if (fetchError || !anonymousCharacters || anonymousCharacters.length === 0) {
      return { success: true, migratedCount: 0 }
    }
    
    // Update all anonymous characters to link to the authenticated user
    const { error: updateError } = await supabase
      .from('roast_me_ai_characters')
      .update({ 
        user_id: user.id,
        session_id: null // Clear session ID after migration
      })
      .eq('session_id', sessionId)
      .is('user_id', null)
    
    if (updateError) {
      console.error('Error migrating characters:', updateError)
      return { success: false }
    }
    
    return { success: true, migratedCount: anonymousCharacters.length }
  } catch (error) {
    console.error('Error in migrateAnonymousCharacters:', error)
    return { success: false }
  }
}

export async function getRecentCharacters() {
  try {
    const supabase = await createClient()
    
    const { data: characters, error } = await supabase
      .from('roast_me_ai_characters')
      .select('*')
      .eq('is_public', true)
      .not('model_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12)
    
    if (error) {
      console.error('Error fetching characters:', error)
      return []
    }
    
    return characters || []
  } catch (error) {
    console.error('Error in getRecentCharacters:', error)
    return []
  }
}

/**
 * Async helper to generate character image in background
 */
async function generateCharacterImageAsync(
  characterId: string,
  originalUrl: string,
  analysis: ImageAnalysisResult,
  roastContent: RoastContent
) {
  console.log('Starting async generation for character:', characterId)
  
  try {
    // Use service client for background operations
    const supabase = createServiceClient()
    
    // Update status to 'generating' to show we're actively working
    console.log('Updating status to generating...')
    const { error: updateError } = await (supabase
      .from('roast_me_ai_characters') as any)
      .update({
        generation_params: {
          ...analysis,
          roast_content: roastContent,
          original_image_url: originalUrl,
          status: 'generating'
        }
      })
      .eq('id', characterId)
    
    if (updateError) {
      console.error('Error updating status to generating:', updateError)
      throw updateError
    }
    
    // Start async generation (fire and forget)
    console.log('Starting async character image generation...')
    
    // Execute the background generation function without awaiting
    generateCharacterImageBackground(
      analysis.features,
      analysis,
      roastContent,
      characterId,
      originalUrl
    ).catch(error => {
      console.error('Async generation error:', error)
    })
    
    // Return immediately - don't wait for generation
    console.log('Returning early while generation continues in background...')
  } catch (error) {
    console.error('Background generation error:', error)
    // Update status to failed
    const supabase = createServiceClient()
    await (supabase
      .from('roast_me_ai_characters') as any)
      .update({
        generation_params: {
          ...analysis,
          roast_content: roastContent,
          original_image_url: originalUrl,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', characterId)
  }
}

