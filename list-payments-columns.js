const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAllColumns() {
  console.log('--- Payments Table Detailed Schema ---');
  
  // We can use a trick: select a row and see the keys, 
  // or use the OpenAPI spec we already have.
  // But let's try to fetch a single (possibly non-existent) row to see the response properties.
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching payments:', error.message);
  } else {
    const columns = data.length > 0 ? Object.keys(data[0]) : 'No data found to infer columns';
    console.log('Columns found via Select:', columns);
  }

  // Also check the specific types by attempting a dummy insert and reading the error
  const { error: insertError } = await supabase.from('payments').insert({ dummy_col_test: true });
  if (insertError) {
      console.log('\nInsert Error (helps identify expected columns):');
      console.log(insertError.message);
  }
}

listAllColumns();
