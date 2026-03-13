const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testManualId() {
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const userId = userData?.id;

  console.log('Inserting with manual ID...');
  const { error } = await supabase.from('payments').insert({
    id: uuidv4(),
    userId: userId,
    amount: 100,
    status: 'PENDING',
    merchant_reference: 'TEST-MANUAL-' + Date.now()
  });

  if (error) {
    console.log('FAILED:', error.message);
    console.log('Hint:', error.hint);
  } else {
    console.log('SUCCESS');
  }
}

testManualId();
