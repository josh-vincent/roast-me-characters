#!/usr/bin/env tsx

/**
 * Script to update all existing characters with composite OG URLs
 * Run with: pnpm tsx scripts/update-og-urls.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCharacterOGUrls() {
  console.log('🔄 Starting to update character OG URLs...');
  
  try {
    // Fetch characters that likely don't have composite OG URLs (older ones)
    const { data: characters, error: fetchError } = await supabase
      .from('roast_me_ai_characters')
      .select('id, model_url, generation_params, image_id')
      .not('model_url', 'is', null)
      .limit(50)  // Process 50 at a time
      .order('created_at', { ascending: true });  // Start with oldest

    if (fetchError) {
      console.error('Error fetching characters:', fetchError);
      return;
    }

    console.log(`Found ${characters?.length || 0} characters to check`);

    if (!characters || characters.length === 0) {
      console.log('No characters found to update');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com';
    let updatedCount = 0;
    let skippedCount = 0;

    for (const character of characters) {
      // Check if already has composite_og_url
      if (character.generation_params?.composite_og_url) {
        console.log(`⏭️  Skipping ${character.id} - already has composite OG URL`);
        skippedCount++;
        continue;
      }

      // Fetch the original image URL separately to avoid join timeout
      let originalImageUrl = null;
      if (character.image_id) {
        const { data: imageData } = await supabase
          .from('roast_me_ai_image_uploads')
          .select('file_url')
          .eq('id', character.image_id)
          .single();
        
        originalImageUrl = imageData?.file_url;
      }
      
      const generatedImageUrl = character.model_url;

      if (!originalImageUrl || !generatedImageUrl) {
        console.log(`⚠️  Skipping ${character.id} - missing image URLs`);
        skippedCount++;
        continue;
      }

      // Create composite OG URL
      const ogImageUrl = new URL('/api/og', baseUrl);
      ogImageUrl.searchParams.set('original', originalImageUrl);
      ogImageUrl.searchParams.set('generated', generatedImageUrl);
      
      const compositeOgUrl = ogImageUrl.toString();

      // Update the character with the composite OG URL
      const updatedParams = {
        ...character.generation_params,
        composite_og_url: compositeOgUrl
      };

      const { error: updateError } = await supabase
        .from('roast_me_ai_characters')
        .update({
          generation_params: updatedParams
        })
        .eq('id', character.id);

      if (updateError) {
        console.error(`❌ Failed to update ${character.id}:`, updateError);
      } else {
        console.log(`✅ Updated ${character.id} with composite OG URL`);
        updatedCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`   Updated: ${updatedCount} characters`);
    console.log(`   Skipped: ${skippedCount} characters (already had OG URL)`);
    console.log(`   Total processed: ${characters.length} characters`);
    
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
updateCharacterOGUrls()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });