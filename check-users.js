const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    console.log('Fetching users from Supabase...');
    const { data, error } = await supabase
        .from('users')
        .select('id, phone, email, username, password')
        .limit(5);

    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }

    console.log('Users found:', JSON.stringify(data, null, 2));
}

checkUsers();
