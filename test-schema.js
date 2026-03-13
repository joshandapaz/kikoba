const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSchema() {
  console.log('Testing with explicit public schema...');
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  
  const { error } = await supabase
    .schema('public')
    .from('payments')
    .insert({
      userId: userData.id,
      amount: 100,
      merchant_reference: 'SCHEMA-TEST-' + Date.now()
    });

  if (error) {
    console.log('FAILED:', error.message);
  } else {
    console.log('SUCCESS');
  }
}

testSchema();
