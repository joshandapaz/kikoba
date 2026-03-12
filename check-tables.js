import { supabaseAdmin } from './lib/supabase.js';

async function checkSchema() {
  const { data, error } = await supabaseAdmin.from('User').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Schema check failed:', error.message);
    if (error.message.includes('not found')) {
      console.log('REASON: Tables do not exist yet.');
    }
  } else {
    console.log('SUCCESS: User table exists!');
  }
}
checkSchema();
