'use server';

import { createClient } from '@supabase/supabase-js';

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
    
    const { data: characters, error } = await supabase
      .from('roast_me_ai_characters')
      .select('id,seo_slug,og_title,og_description,model_url,thumbnail_url,medium_url,view_count,likes,created_at,is_public,generation_params')
      .eq('is_public', true)
      .not('model_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Database error in getRecentCharacters:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      return {
        success: false,
        error: 'Failed to load recent characters',
        characters: []
      };
    }
    
    console.log(`Found ${characters?.length || 0} characters in database`);
    
    // Transform the data to match expected format
    const transformedCharacters = characters?.map(char => {
      // Extract original image URL from composite_og_url
      let originalImageUrl = null;
      if (char.generation_params?.composite_og_url) {
        try {
          const url = new URL(char.generation_params.composite_og_url);
          const originalParam = url.searchParams.get('original');
          if (originalParam) {
            originalImageUrl = decodeURIComponent(originalParam);
          }
        } catch (error) {
          console.warn('Failed to parse composite_og_url:', error);
        }
      }

      return {
        ...char,
        image: originalImageUrl ? { file_url: originalImageUrl } : undefined,
        features: char.generation_params?.features || []
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