const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPasswordLength() {
    const { data: user, error } = await supabase
        .from('users')
        .select('password')
        .eq('phone', '+255683267434')
        .single();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (user) {
        console.log('Password hash:', user.password);
        console.log('Length:', user.password.length);
    }
}

checkPasswordLength();
