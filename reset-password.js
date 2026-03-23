const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetPassword() {
    console.log('Resetting password for +255683267434...');
    const hashed = await bcrypt.hash('password123', 10);
    
    const { data, error } = await supabase
        .from('users')
        .update({ password: hashed })
        .eq('phone', '+255683267434')
        .select();

    if (error) {
        console.error('Error updating password:', error.message);
        return;
    }

    console.log('Password reset successful:', JSON.stringify(data, null, 2));
}

resetPassword();
