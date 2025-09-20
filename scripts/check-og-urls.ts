#!/usr/bin/env tsx

/**
 * Script to check how many characters need OG URL updates
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

async function checkOGUrls() {
  console.log('🔍 Checking character OG URL status...\n');
  
  try {
    // Count total characters with model_url
    const { count: totalWithImages, error: countError1 } = await supabase
      .from('roast_me_ai_characters')
      .select('*', { count: 'exact', head: true })
      .not('model_url', 'is', null);

    if (countError1) {
      console.error('Error counting characters:', countError1);
      return;
    }

    console.log(`📊 Total characters with generated images: ${totalWithImages || 0}`);

    // Try to fetch a small sample to check for composite_og_url
    const { data: sample, error: sampleError } = await supabase
      .from('roast_me_ai_characters')
      .select('generation_params')
      .not('model_url', 'is', null)
      .limit(5);

    if (sampleError) {
      console.error('Error fetching sample:', sampleError);
      return;
    }

    const withComposite = sample?.filter(c => c.generation_params?.composite_og_url).length || 0;
    const withoutComposite = (sample?.length || 0) - withComposite;

    console.log(`\n🔍 Sample of 5 characters:`);
    console.log(`   With composite OG URL: ${withComposite}`);
    console.log(`   Without composite OG URL: ${withoutComposite}`);

    if (withoutComposite > 0 && totalWithImages) {
      const estimatedNeedingUpdate = Math.round((withoutComposite / (sample?.length || 1)) * totalWithImages);
      console.log(`\n⚡ Estimated characters needing update: ~${estimatedNeedingUpdate}`);
    }

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
checkOGUrls()
  .then(() => {
    console.log('\n✨ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });