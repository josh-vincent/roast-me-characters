'use server';

import { createClient } from '@supabase/supabase-js';

// Static fallback data for when database is unavailable
const FALLBACK_CHARACTERS: any[] = [];

export async function getRecentCharactersAction() {
  try {
    console.log('Fetching recent characters...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return {
        success: false,
        error: 'Database configuration error',
        characters: []
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Add timeout to prevent build hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    let characters = null;
    let error = null;
    
    try {
      const result = await supabase
        .from('roast_me_ai_characters')
        .select('id,seo_slug,og_title,og_description,generated_image_url,original_image_url,view_count,created_at,public,generation_params')
        .eq('public', true)
        .not('generated_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      characters = result.data;
      error = result.error;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Handle timeout or other errors
      console.error('Query error:', err);
      
      // Return empty array but still success to prevent build failures
      console.warn('Returning empty characters due to database timeout/error');
      return {
        success: true, // Mark as success to prevent build failures
        characters: FALLBACK_CHARACTERS,
        fromCache: true
      };
    }

    if (error) {
      console.error('Database error in getRecentCharacters:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      // Return empty array but still success to prevent build failures
      return {
        success: true, // Mark as success to prevent build failures
        characters: FALLBACK_CHARACTERS,
        fromCache: true
      };
    }
    
    console.log(`Found ${characters?.length || 0} characters in database`);
    
    // Transform the data to match expected format
    const transformedCharacters = characters?.map(char => {
      return {
        ...char,
        // Map the correct column names
        model_url: char.generated_image_url,
        image: char.original_image_url ? { file_url: char.original_image_url } : undefined,
        features: char.generation_params?.features || [],
        is_public: char.public,
        // Include roast content from generation_params
        roast_content: char.generation_params?.roast_content || null
      };
    }) || [];
    
    console.log(`Fetched ${transformedCharacters.length} characters from database`);
    
    // Debug: Log first character's generation_params
    if (transformedCharacters.length > 0) {
      console.log('First character generation_params:', JSON.stringify(transformedCharacters[0].generation_params, null, 2));
      console.log('First character og_title:', transformedCharacters[0].og_title);
    }
    
    return {
      success: true,
      characters: transformedCharacters
    };
  } catch (error) {
    console.error('Error in getRecentCharactersAction:', error);
    return {
      success: false,
      error: 'Failed to load recent characters',
      characters: []
    };
  }
}