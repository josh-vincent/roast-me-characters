#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase Schema Cache\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Create client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  console.log('Attempting to query with service role key...\n');
  
  // Try to query the table - this should refresh the cache
  const { data, error } = await supabase
    .from('roast_me_ai_characters')
    .select('id')
    .limit(1);
  
  if (error) {
    if (error.code === 'PGRST205') {
      console.log('❌ Schema cache issue detected');
      console.log('\n📝 IMPORTANT: The schema cache needs to be refreshed manually');
      console.log('\nPlease do ONE of the following:');
      console.log('\n1. Go to your Supabase Dashboard:');
      console.log(`   https://supabase.com/dashboard/project/iwazmzjqbdnxvzqvuimt/api`);
      console.log('   - Click on "Tables" in the left sidebar');
      console.log('   - This will refresh the schema cache automatically');
      console.log('\n2. OR restart the Supabase API service from the dashboard');
      console.log('\n3. OR wait a few minutes for the cache to refresh automatically');
    } else {
      console.error('Error:', error);
    }
  } else {
    console.log('✅ Table is accessible!');
    console.log(`   Found ${data?.length || 0} records`);
  }
  
  // Also try with anon key to verify public access
  console.log('\nTesting with anon key...');
  const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('roast_me_ai_characters')
    .select('id')
    .limit(1);
  
  if (anonError) {
    console.log('❌ Anon key error:', anonError.message);
  } else {
    console.log('✅ Anon key works!');
  }
}

refreshSchema()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });