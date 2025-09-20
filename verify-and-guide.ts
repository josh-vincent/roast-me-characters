#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

console.log('🔧 Supabase Migration Guide\n');
console.log('='.repeat(50));

const projectRef = 'iwazmzjqbdnxvzqvuimt';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('✅ Configuration Status:');
console.log(`  Project URL: ${supabaseUrl}`);
console.log(`  Anon Key: ${hasAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  Service Role Key: ${hasServiceKey ? '✅ Set' : '❌ Missing'}`);

console.log('\n📝 Migration Ready at:');
console.log('  supabase/migrations/20250920000000_create_roast_me_schema.sql');

console.log('\n🚀 To Deploy the Migration:\n');

console.log('Option 1: Supabase Dashboard (Recommended - 2 minutes)');
console.log('━'.repeat(50));
console.log('1. Click this link to open SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('2. Copy ALL contents from:');
console.log('   supabase/migrations/20250920000000_create_roast_me_schema.sql\n');
console.log('3. Paste into the SQL Editor\n');
console.log('4. Click the green "Run" button\n');
console.log('5. You should see "Success. No rows returned"\n');

console.log('\nOption 2: Using Supabase CLI');
console.log('━'.repeat(50));
console.log('1. Get your access token from:');
console.log('   https://app.supabase.com/account/tokens\n');
console.log('2. Run these commands:');
console.log(`   supabase login --token YOUR_ACCESS_TOKEN`);
console.log(`   supabase link --project-ref ${projectRef}`);
console.log(`   supabase db push\n`);

console.log('\n✨ What the Migration Will Create:');
console.log('━'.repeat(50));
console.log('  • roast_me_ai_characters table (with all required columns)');
console.log('  • roast_me_ai_users table');
console.log('  • roast_me_ai_image_uploads table');
console.log('  • roast_me_ai_features table');
console.log('  • roast_me_ai_shares table');
console.log('  • All necessary indexes for performance');
console.log('  • Row Level Security policies');
console.log('  • Proper permissions for anon/authenticated users');

console.log('\n🎯 Quick Link to SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('\n');