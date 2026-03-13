const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testColumnInsert() {
    const { data: userData } = await supabase.from('users').select('id').limit(1).single();
    if (!userData) {
        console.error('No users found to test with');
        return;
    }
    const userId = userData.id;

    console.log('Testing Column-Specific Insert into Payments...');
    const { data, error } = await supabase.from('payments').insert({
        user_id: userId,
        merchant_reference: 'TEST-COL-' + Date.now()
    }).select();

    if (error) {
        console.error('Column Insert FAILED:', error.message);
    } else {
        console.log('Column Insert SUCCESS:', data[0]);
    }
}

testColumnInsert();
