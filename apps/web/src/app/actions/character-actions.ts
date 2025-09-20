'use server'

import { createClient } from '@/lib/supabase/server'
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

    // Store character in database
    const characterData = {
      id: characterId,
      user_id: user?.id || null,
      session_id: !user && anonSessionId ? anonSessionId : null,
      original_image_url: originalUrl,
      generated_image_url: null,
      generation_params: {
        ...analysisResult,
        roast_content: roastContent,
        status: 'pending'
      },
      og_title: `${roastContent.title} | Roast Me Characters`,
      og_description: roastContent.punchline,
      public: true,
      views_count: 0
    }

    const { error: insertError } = await supabase
      .from('roast_me_ai_characters')
      .insert(characterData)
    
    if (insertError) {
      console.error('Database error:', insertError)
      return { success: false, error: 'Failed to save character' }
    }

    // Generate character image in background
    generateCharacterImageAsync(characterId, originalUrl, analysisResult, roastContent)
    
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

    // Update database
    const { error: updateError } = await supabase
      .from('roast_me_ai_characters')
      .update({
        generated_image_url: generatedUrl,
        generation_params: {
          ...params,
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
      .eq('public', true)
      .not('generated_image_url', 'is', null)
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
  try {
    const supabase = await createClient()
    
    // Generate the character image
    const result = await generateCharacterImage(
      analysis.features,
      analysis,
      [],
      roastContent,
      characterId
    )
    
    const generatedUrl = result?.original || null
    
    if (generatedUrl) {
      // Update the character with the generated image
      await supabase
        .from('roast_me_ai_characters')
        .update({
          generated_image_url: generatedUrl,
          generation_params: {
            ...analysis,
            roast_content: roastContent,
            status: 'completed'
          }
        })
        .eq('id', characterId)
    }
  } catch (error) {
    console.error('Background generation error:', error)
    // Update status to failed
    const supabase = await createClient()
    await supabase
      .from('roast_me_ai_characters')
      .update({
        generation_params: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', characterId)
  }
}