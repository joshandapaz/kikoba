const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking "payments" table...');
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  
  if (error) {
    console.log('Table "payments" error:', error.message);
  } else {
    console.log('Table "payments" exists. Data:', data);
    // If it exists but is empty, we still want to know columns.
    // We can try to get them via a dummy update or similar, 
    // but better to just try a known column name.
    const columns = ['id', 'merchant_reference', 'order_tracking_id', 'userId', 'amount', 'status', 'createdAt', 'external_id', 'provider'];
    for (const col of columns) {
        const { error: colError } = await supabase.from('payments').select(col).limit(1);
        console.log(`Column '${col}':`, colError ? 'MISSING' : 'EXISTS');
    }
  }
}

checkSchema();
