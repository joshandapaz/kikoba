const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHash() {
    const { data: user } = await supabase.from('users').select('*').eq('phone', '+255683267434').single();
    if (user) {
        console.log('User hash length:', user.password.length);
        console.log('User hash:', user.password);
        console.log('Compare with password123:', bcrypt.compareSync('password123', user.password));
    } else {
        console.log('User not found');
    }
}
checkHash().catch(console.error);
