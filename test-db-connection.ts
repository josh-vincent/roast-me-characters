#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function testConnection() {
  console.log('🔍 Testing Supabase Connection\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`  - SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Missing required environment variables');
    process.exit(1);
  }
  
  console.log(`\n🌐 Connecting to: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test 1: Simple count query
  console.log('\n📊 Test 1: Count characters in database...');
  const startCount = Date.now();
  
  try {
    const { count, error } = await supabase
      .from('roast_me_ai_characters')
      .select('*', { count: 'exact', head: true });
    
    const countTime = Date.now() - startCount;
    
    if (error) {
      console.error(`  ❌ Count failed (${countTime}ms):`, error.message);
      console.error('     Error code:', error.code);
      console.error('     Error details:', error.details);
    } else {
      console.log(`  ✅ Count successful (${countTime}ms): ${count || 0} characters`);
    }
  } catch (err) {
    console.error('  ❌ Count query threw error:', err);
  }
  
  // Test 2: Fetch one character
  console.log('\n📊 Test 2: Fetch one character...');
  const startFetch = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('roast_me_ai_characters')
      .select('id,created_at,public')
      .limit(1)
      .single();
    
    const fetchTime = Date.now() - startFetch;
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`  ℹ️ No rows found (${fetchTime}ms) - table is empty`);
      } else {
        console.error(`  ❌ Fetch failed (${fetchTime}ms):`, error.message);
        console.error('     Error code:', error.code);
      }
    } else {
      console.log(`  ✅ Fetch successful (${fetchTime}ms)`);
      if (data) {
        console.log(`     Character ID: ${data.id}`);
        console.log(`     Created: ${data.created_at}`);
        console.log(`     Public: ${data.public}`);
      }
    }
  } catch (err) {
    console.error('  ❌ Fetch query threw error:', err);
  }
  
  // Test 3: Test auth
  console.log('\n🔐 Test 3: Check auth status...');
  const startAuth = Date.now();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    const authTime = Date.now() - startAuth;
    
    if (error) {
      console.error(`  ❌ Auth check failed (${authTime}ms):`, error.message);
    } else {
      console.log(`  ✅ Auth check successful (${authTime}ms)`);
      console.log(`     Session: ${session ? 'Active' : 'None'}`);
    }
  } catch (err) {
    console.error('  ❌ Auth check threw error:', err);
  }
  
  // Test 4: Check storage bucket
  console.log('\n💾 Test 4: Check storage bucket...');
  const startStorage = Date.now();
  
  try {
    const { data, error } = await supabase.storage
      .from('roast-me-ai')
      .list('', { limit: 1 });
    
    const storageTime = Date.now() - startStorage;
    
    if (error) {
      console.error(`  ❌ Storage check failed (${storageTime}ms):`, error.message);
    } else {
      console.log(`  ✅ Storage check successful (${storageTime}ms)`);
      console.log(`     Files found: ${data?.length || 0}`);
    }
  } catch (err) {
    console.error('  ❌ Storage check threw error:', err);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 CONNECTION TEST SUMMARY');
  console.log('='.repeat(50));
  
  // Check if it's a cold start issue
  console.log('\n💡 Possible issues:');
  console.log('  1. Supabase free tier pauses after inactivity');
  console.log('  2. Database might need to wake up (cold start)');
  console.log('  3. Network connectivity issues');
  console.log('  4. Supabase project might be paused');
  console.log('\n📌 Check your Supabase dashboard at:');
  console.log('  https://app.supabase.com/projects');
}

testConnection()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });