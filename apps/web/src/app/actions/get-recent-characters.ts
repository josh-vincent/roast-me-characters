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
    
    try {
      // Simple query without timeout - let Supabase handle its own timeouts
      const { data: characters, error } = await supabase
        .from('roast_me_ai_characters')
        .select('id,seo_slug,og_title,og_description,model_url,image_id,view_count,created_at,is_public,generation_params')
        .eq('is_public', true)
        .not('model_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (error) {
        console.error('Database error in getRecentCharacters:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
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
          generated_image_url: char.model_url,
          features: char.generation_params?.features || [],
          public: char.is_public,
          // Include roast content from generation_params
          roast_content: char.generation_params?.roast_content || null
        };
      }) || [];
      
      console.log(`Fetched ${transformedCharacters.length} characters from database`);
      
      // Debug: Log first character's generation_params
      if (transformedCharacters.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('First character generation_params:', JSON.stringify(transformedCharacters[0].generation_params, null, 2));
        console.log('First character og_title:', transformedCharacters[0].og_title);
      }
      
      return {
        success: true,
        characters: transformedCharacters
      };
    } catch (error) {
      console.error('Error in getRecentCharactersAction:', error);
      // Return empty array but still success to prevent build failures
      return {
        success: true,
        characters: FALLBACK_CHARACTERS,
        fromCache: true
      };
    }
  } catch (error) {
    console.error('Unexpected error in getRecentCharactersAction:', error);
    return {
      success: true,
      characters: FALLBACK_CHARACTERS,
      fromCache: true
    };
  }
}