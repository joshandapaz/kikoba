const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  console.log('Listing Tables:');
  // We can't query information_schema directly via .from() 
  // unless there's a view, but we can try to use RPC if it exists.
  // Instead, let's try to query a few variations of the table name.
  
  const tables = ['payments', 'Payments', 'PAYMENTS', '"payments"', 'public.payments'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(0);
    console.log(`Table '${t}':`, error ? `ERROR: ${error.message}` : 'EXISTS');
  }
}

listTables();
