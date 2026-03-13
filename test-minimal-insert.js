const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMinimalInsert() {
    const { data: userData } = await supabase.from('users').select('id').limit(1).single();
    if (!userData) {
        console.error('No users found to test with');
        return;
    }
    const userId = userData.id;

    console.log('Testing Minimal Insert into Payments...');
    // Only columns we are SURE exist based on OpenAPI
    const { data, error } = await supabase.from('payments').insert({
        user_id: userId,
        metadata: { test: 'minimal' }
    }).select();

    if (error) {
        console.error('Minimal Insert FAILED:', error.message);
    } else {
        console.log('Minimal Insert SUCCESS:', data[0]);
    }
}

testMinimalInsert();
