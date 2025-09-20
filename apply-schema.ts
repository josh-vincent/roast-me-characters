#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function applySchema() {
  console.log('📦 Applying Schema to New Supabase Database\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  console.log(`📍 Database: ${supabaseUrl}\n`);
  
  // Create client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  // Read the complete schema file
  const schemaPath = path.join(__dirname, 'supabase', 'complete_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  console.log('📄 Schema file loaded: complete_schema.sql');
  console.log('⚡ Applying schema...\n');
  
  // Split the schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    // Get first line of statement for logging
    const firstLine = statement.split('\n')[0];
    const shortStatement = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    
    try {
      // Execute the SQL using RPC (since we can't execute arbitrary SQL via REST API)
      // We'll need to use the Supabase dashboard or direct psql connection
      console.log(`⚠️  Statement: ${shortStatement}`);
      console.log(`   Note: Direct SQL execution requires psql or Supabase Dashboard`);
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 SCHEMA APPLICATION NOTICE');
  console.log('='.repeat(50));
  console.log('\n⚠️  Direct SQL execution is not available via Supabase JS client.');
  console.log('\n📝 Please apply the schema using ONE of these methods:\n');
  console.log('Option 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard/project/iwazmzjqbdnxvzqvuimt/sql');
  console.log('  2. Click "New query"');
  console.log('  3. Paste the contents of: supabase/complete_schema.sql');
  console.log('  4. Click "Run"\n');
  console.log('Option 2: Using psql (if you have the connection string)');
  console.log('  psql -f supabase/complete_schema.sql "postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"');
  
  // Test if tables exist
  console.log('\n🔍 Checking current database state...\n');
  
  const tables = [
    'roast_me_ai_characters',
    'roast_me_ai_image_uploads',
    'roast_me_ai_features',
    'roast_me_ai_users',
    'roast_me_ai_shares'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Table ${table} - NOT FOUND`);
      } else {
        console.log(`  ✅ Table ${table} - EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ Table ${table} - ERROR`);
    }
  }
  
  // Check storage bucket
  console.log('\n💾 Checking storage bucket...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (!bucketError && buckets) {
    const roastMeBucket = buckets.find(b => b.name === 'roast-me-ai');
    if (roastMeBucket) {
      console.log('  ✅ Storage bucket "roast-me-ai" exists');
    } else {
      console.log('  ❌ Storage bucket "roast-me-ai" not found');
      console.log('\n  To create the bucket:');
      console.log('  1. Go to Storage in Supabase Dashboard');
      console.log('  2. Create bucket named: roast-me-ai');
      console.log('  3. Set it as PUBLIC');
    }
  }
}

applySchema()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });