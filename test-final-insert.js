const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFinalInsert() {
    const userId = "00d28420-5f4f2f-ae15-e37b26d83f2";

    console.log('Testing Final Insert into Payments with ID:', userId);
    const { data, error } = await supabase.from('payments').insert({
        user_id: userId,
        merchant_reference: 'TEST-FINAL-' + Date.now(),
        amount: 500
    }).select();

    if (error) {
        console.error('Final Insert FAILED:', error.message);
    } else {
        console.log('Final Insert SUCCESS:', data[0]);
    }
}

testFinalInsert();
