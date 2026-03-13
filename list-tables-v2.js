const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listVisibleTables() {
    console.log('--- Visible Tables ---');
    
    // We can query the OpenAPI spec path via the client indirectly or directly
    // Let's try to query information_schema via RPC if possible, 
    // but usually, we just want to see if we can select from anything.
    
    try {
        const { data, error } = await supabase.rpc('get_tables_info'); // Might not exist
        if (error) {
            console.log('RPC failed (expected). Trying direct REST fetch...');
            // In Supabase, you can't easily list tables via supabase-js without an RPC.
            // But we can check the root /rest/v1/ directly (which I did before but it failed).
            // Let's try to fetch a row from known tables.
            const knownTables = ['users', 'groups', 'payments', 'activities', 'loans'];
            for (const table of knownTables) {
                const { error: tblError } = await supabase.from(table).select('*').limit(0);
                if (tblError) {
                    console.log(`Table '${table}': ERROR - ${tblError.message}`);
                } else {
                    console.log(`Table '${table}': VISIBLE`);
                }
            }
        } else {
            console.log('Tables:', data);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listVisibleTables();
