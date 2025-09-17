// Simple migration runner using require from web app directory
const path = require('path');
const fs = require('fs');

// Change to the web app directory where the dependencies are
process.chdir(path.join(__dirname, 'apps', 'web'));

// Now load the modules from the web app's node_modules
require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Create the table directly with a simple query
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS roast_me_ai_waitlist (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'social')),
      is_notified BOOLEAN DEFAULT false,
      notification_sent_at TIMESTAMP WITH TIME ZONE NULL
    );
  `;
  
  console.log('Creating waitlist table...');
  
  try {
    // Try using a direct query approach
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.log('RPC not available, trying alternative approach...');
      // Alternative: Try creating via REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createTableSQL })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }
    
    console.log('✅ Table created successfully');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('roast_me_ai_waitlist')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Table is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();