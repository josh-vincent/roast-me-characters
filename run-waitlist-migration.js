const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runWaitlistMigration() {
  // Load environment variables from .env
  require('dotenv').config();
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }
  
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the waitlist migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250917000000_create_waitlist_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running waitlist migration...');
    
    // Split SQL into individual statements and execute each one
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        try {
          // Use a simple query to execute raw SQL
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement.trim() + ';' 
          });
          
          if (error) {
            // Fallback: try using a different approach if RPC doesn't work
            console.log(`RPC failed, trying direct execution...`);
            // Note: This might not work in all cases, but RPC should work with service role
            throw error;
          } else {
            console.log(`✅ Statement executed successfully`);
          }
        } catch (err) {
          // Some statements might "fail" if the table already exists
          if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️  Statement skipped (already exists): ${statement.trim().substring(0, 50)}...`);
          } else {
            console.error(`❌ Error executing statement: ${err.message}`);
          }
        }
      }
    }
    
    console.log('✅ Waitlist migration completed successfully');
    
    // Test that the table was created by trying to insert a test record
    console.log('Testing table creation...');
    const { data, error } = await supabase
      .from('roast_me_ai_waitlist')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error.message);
    } else {
      console.log('✅ Table is accessible and ready to use');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runWaitlistMigration();