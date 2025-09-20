#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function testNewConnection() {
  console.log('🔍 Testing NEW Supabase Project Connection\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`  - URL: ${supabaseUrl}`);
  console.log(`  - Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Missing required environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test 1: Check if table exists
  console.log('\n📊 Test 1: Check for roast_me_ai_characters table...');
  
  try {
    const { count, error } = await supabase
      .from('roast_me_ai_characters')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('  ❌ Table does not exist - needs schema creation');
      } else {
        console.error(`  ❌ Error: ${error.message} (${error.code})`);
      }
    } else {
      console.log(`  ✅ Table exists! ${count || 0} rows`);
    }
  } catch (err) {
    console.error('  ❌ Query threw error:', err);
  }
  
  // Test 2: Check auth
  console.log('\n🔐 Test 2: Check auth configuration...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error(`  ❌ Auth check failed: ${error.message}`);
    } else {
      console.log(`  ✅ Auth is configured`);
    }
  } catch (err) {
    console.error('  ❌ Auth check threw error:', err);
  }
  
  // Test 3: Check storage bucket
  console.log('\n💾 Test 3: Check for roast-me-ai storage bucket...');
  
  try {
    const { data, error } = await supabase.storage
      .from('roast-me-ai')
      .list('', { limit: 1 });
    
    if (error) {
      if (error.message.includes('not found')) {
        console.log('  ❌ Storage bucket does not exist - needs creation');
      } else {
        console.error(`  ❌ Storage error: ${error.message}`);
      }
    } else {
      console.log(`  ✅ Storage bucket exists`);
    }
  } catch (err) {
    console.error('  ❌ Storage check threw error:', err);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 NEW DATABASE STATUS');
  console.log('='.repeat(50));
  console.log('\n💡 Next steps:');
  console.log('  1. Apply the database schema (complete_schema.sql)');
  console.log('  2. Create the storage bucket (roast-me-ai)');
  console.log('  3. Configure bucket permissions');
}

testNewConnection()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });