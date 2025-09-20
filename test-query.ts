#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function testQuery() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Testing the exact query from get-recent-characters...\n');
  
  const { data: characters, error } = await supabase
    .from('roast_me_ai_characters')
    .select('id,seo_slug,og_title,og_description,model_url,image_id,view_count,created_at,is_public,generation_params')
    .eq('is_public', true)
    .not('model_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12);
  
  if (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error.details);
  } else {
    console.log(`✅ Query successful! Found ${characters?.length || 0} characters`);
    
    if (characters && characters.length > 0) {
      console.log('\nFirst character:');
      console.log('  ID:', characters[0].id);
      console.log('  SEO Slug:', characters[0].seo_slug);
      console.log('  Title:', characters[0].og_title);
      console.log('  Public:', characters[0].is_public);
      console.log('  Has model_url:', !!characters[0].model_url);
      console.log('  Model URL:', characters[0].model_url);
    }
  }
}

testQuery()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });