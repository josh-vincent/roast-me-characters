#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function createStorageBucket() {
  console.log('💾 Creating Storage Bucket\n');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Create client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  console.log('Creating bucket: roast-me-ai');
  
  // Create the storage bucket
  const { data, error } = await supabase.storage.createBucket('roast-me-ai', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Bucket already exists');
    } else {
      console.error('❌ Error creating bucket:', error.message);
      return;
    }
  } else {
    console.log('✅ Bucket created successfully');
  }
  
  // List existing buckets to verify
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (!listError && buckets) {
    const roastMeBucket = buckets.find(b => b.name === 'roast-me-ai');
    if (roastMeBucket) {
      console.log('\n📋 Bucket Details:');
      console.log('  Name:', roastMeBucket.name);
      console.log('  Public:', roastMeBucket.public);
      console.log('  Created:', roastMeBucket.created_at);
      console.log('  File size limit:', roastMeBucket.file_size_limit);
    }
  }
  
  console.log('\n✅ Storage bucket is ready!');
}

createStorageBucket()
  .then(() => {
    console.log('\n✅ Setup completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });