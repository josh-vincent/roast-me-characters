#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function deployMigration() {
  console.log('🚀 Deploying Migration to Supabase\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  console.log(`📍 Target: ${supabaseUrl}\n`);
  
  // Unfortunately, Supabase JS client doesn't support direct SQL execution
  // We need to use the REST API directly
  
  const projectRef = 'iwazmzjqbdnxvzqvuimt';
  const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;
  
  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250920000000_create_roast_me_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Migration loaded\n');
  
  // Split the SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  // Since we can't execute raw SQL via the REST API, let's use a different approach
  // We'll create a function that executes our migration
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  // First, let's check what tables already exist
  console.log('Checking existing tables...\n');
  
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
        if (error.code === 'PGRST205') {
          console.log(`  ❌ Table ${table} - NOT FOUND (will be created)`);
        } else {
          console.log(`  ⚠️ Table ${table} - Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table ${table} - EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ Table ${table} - ERROR`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 MIGRATION DEPLOYMENT');
  console.log('='.repeat(50));
  
  // Since we can't execute raw SQL directly, we need to use the Dashboard
  console.log('\n⚠️  Direct SQL execution requires using the Supabase Dashboard\n');
  console.log('The migration has been prepared and saved to:');
  console.log(`📁 ${migrationPath}\n`);
  
  // However, we can try using curl to execute via the Management API
  console.log('Attempting to execute via Management API...\n');
  
  // Create a temporary SQL file for execution
  const tempSqlPath = path.join(__dirname, 'temp-migration.sql');
  fs.writeFileSync(tempSqlPath, migrationSQL);
  
  console.log('📝 Next Steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/iwazmzjqbdnxvzqvuimt/sql/new');
  console.log('2. Copy the contents from: supabase/migrations/20250920000000_create_roast_me_schema.sql');
  console.log('3. Paste and click "Run"\n');
  console.log('OR\n');
  console.log('Use the following curl command with your database password:');
  console.log(`
curl -X POST \\
  'https://${projectRef}.supabase.co/rest/v1/rpc' \\
  -H "apikey: ${process.env.SUPABASE_SERVICE_ROLE_KEY}" \\
  -H "Authorization: Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "YOUR_SQL_HERE"
  }'
  `);
  
  // Clean up temp file
  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }
}

deployMigration()
  .then(() => {
    console.log('\n✅ Migration prepared');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });