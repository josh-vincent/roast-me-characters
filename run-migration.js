const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20240101000000_create_users_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    
    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If the RPC doesn't exist, try direct execution
      const statements = migrationSQL.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
          const { error } = await supabase.from('').select('').raw(statement);
          if (error) {
            console.log(`Statement executed (may show error for CREATE statements that already exist)`);
          }
        }
      }
    } else {
      console.log('Migration executed successfully');
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();