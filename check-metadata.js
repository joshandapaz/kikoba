const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMetadata() {
  const { data, error } = await supabase.from('payments').select('metadata').limit(1);
  if (error) {
    console.log('METADATA_MISSING: ' + error.message);
  } else {
    console.log('METADATA_EXISTS');
  }
}

checkMetadata();
