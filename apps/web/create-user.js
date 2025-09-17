const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  try {
    const { data, error } = await supabase
      .from('roast_me_ai_users')
      .insert({
        id: 'c9972a8a-8191-4d71-b4ba-fdd0c2bcbc9d',
        email: 'user@email.com', // Replace with actual email if known
        is_anonymous: false,
        credits: 28, // Current credits from webhook logs
        images_created: 0,
        plan: 'free'
      })
      .select();

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('User created successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser();