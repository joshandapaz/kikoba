const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Try to use a different schema option or force a refresh
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'x-my-custom-header': 'test' } }
});

async function testAdvanced() {
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const userId = userData.id;

  console.log('Testing Advanced Insert...');
  const { error } = await supabase.from('payments').insert({
    userId,
    amount: 99,
    merchant_reference: 'ADV-' + Date.now()
  });

  if (error) {
    console.log('FAILED:', error.message);
    if (error.message.includes('schema cache')) {
        console.log('REASON: Stale PostgREST cache detected.');
    }
  } else {
    console.log('SUCCESS');
  }
}

testAdvanced();
