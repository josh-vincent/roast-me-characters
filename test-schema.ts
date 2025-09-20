#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function checkSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Testing with minimal query to find schema...\n');
  
  // Try to get just one row with all columns
  const { data: character, error } = await supabase
    .from('roast_me_ai_characters')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Error code:', error.code);
    
    // Try a more basic query
    console.log('\nTrying basic query with no columns specified...');
    const { data: basicData, error: basicError } = await supabase
      .from('roast_me_ai_characters')
      .select()
      .limit(1);
    
    if (basicError) {
      console.error('❌ Basic query also failed:', basicError.message);
    } else {
      console.log('✅ Basic query worked!');
      if (basicData && basicData.length > 0) {
        console.log('\nAvailable columns:');
        Object.keys(basicData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof basicData[0][key]} = ${basicData[0][key] === null ? 'null' : (typeof basicData[0][key] === 'string' && basicData[0][key].length > 50 ? basicData[0][key].substring(0, 50) + '...' : basicData[0][key])}`);
        });
      }
    }
  } else {
    console.log('✅ Query successful!');
    if (character) {
      console.log('\nAvailable columns:');
      Object.keys(character).forEach(key => {
        console.log(`  - ${key}: ${typeof character[key]} = ${character[key] === null ? 'null' : (typeof character[key] === 'string' && character[key].length > 50 ? character[key].substring(0, 50) + '...' : character[key])}`);
      });
    }
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });