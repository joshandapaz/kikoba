const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function crossTest() {
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const userId = userData.id;

  console.log('Testing Activities Insert...');
  const { error: actError } = await supabase.from('activities').insert({
    userId,
    action: 'Test Schema Cache',
    date: new Date().toISOString()
  });
  console.log('Activities:', actError ? `FAILED (${actError.message})` : 'SUCCESS');

  console.log('Testing Payments Insert...');
  const { error: payError } = await supabase.from('payments').insert({
    userId,
    amount: 1,
    merchant_reference: 'TEST-' + Date.now()
  });
  console.log('Payments:', payError ? `FAILED (${payError.message})` : 'SUCCESS');
}

crossTest();
