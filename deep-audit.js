const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
  console.log('--- Payments Table Audit ---');
  
  // 1. Get a valid user
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const validUserId = userData?.id;
  console.log('Valid User ID:', validUserId);

  if (!validUserId) {
    console.error('No users found in DB. Cannot test payments (FK required).');
    return;
  }

  // 2. Try minimal insert
  console.log('\nTesting minimal insert (userId, amount, merchant_reference)...');
  const { error: minimalError } = await supabase.from('payments').insert({
    userId: validUserId,
    amount: 100,
    merchant_reference: 'AUDIT-' + Date.now()
  });

  if (minimalError) {
    console.log('MINIMAL INSERT FAILED:');
    console.log('Code:', minimalError.code);
    console.log('Message:', minimalError.message);
    console.log('Details:', minimalError.details);
    console.log('Hint:', minimalError.hint);
  } else {
    console.log('MINIMAL INSERT SUCCESS');
  }

  // 3. Check for specific columns
  const colsToTest = ['external_id', 'provider', 'metadata', 'merchant_reference'];
  console.log('\nColumn probe:');
  for (const col of colsToTest) {
    const { error } = await supabase.from('payments').select(col).limit(1);
    console.log(`Column '${col}':`, error ? `MISSING (${error.message})` : 'EXISTS');
  }
}

deepAudit();
