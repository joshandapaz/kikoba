
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  console.log('Checking/Adding avatar_url column...');
  
  // Using direct SQL via RPC if available, or just trying to update a dummy row to check
  // Since I don't have a direct SQL runner without 'pg', I'll use the supabaseAdmin to try an update
  // Actually, I can use the 'supabaseAdmin' to fetch the first user and check the fields.
  
  const { data, error } = await supabase.from('users').select('*').limit(1).single();
  
  if (error) {
    console.error('Error fetching user:', error);
    process.exit(1);
  }

  if (data && data.avatar_url !== undefined) {
    console.log('Column "avatar_url" already exists.');
  } else {
    console.log('Column "avatar_url" is MISSING.');
    console.log('Action: User needs to run SQL: ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;');
    // Note: I can't run ALTER TABLE via supabase-js unless there's an RPC.
  }
}

addColumn();
