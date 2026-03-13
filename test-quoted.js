const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testQuoted() {
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const userId = userData.id;

  console.log('Testing Quoted Table Name Insert...');
  // Using '"payments"' with double quotes
  const { error } = await supabase.from('"payments"').insert({
    userId,
    amount: 111,
    merchant_reference: 'QUOTED-' + Date.now()
  });

  if (error) {
    console.log('FAILED:', error.message);
  } else {
    console.log('SUCCESS');
  }
}

testQuoted();
