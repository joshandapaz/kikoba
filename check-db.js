const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Trying to find any table with "payment" in the name...');
  
  // Since we can't run raw SQL easily without a pre-defined RPC, 
  // we'll try common variations.
  const variations = ['payment', 'Payments', 'Payment', 'user_payments', 'transaction_payments'];
  for (const table of variations) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (!error) {
      console.log(`FOUND: ${table}`);
    }
  }
}

checkSchema();
