const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bggiguzhkdxfwgfbuqfy.supabase.co',
  'sb_secret_SRsnidbbg9KZOFv6fNKH_Q_O_zvfwxd'
);

async function checkData() {
  try {
    const { data, error } = await supabase.from('User').select('*');
    if (error) {
      console.log('SDK Error:', error.message);
    } else {
      console.log('SDK Success!');
      console.log('Data Length:', data.length);
      console.log('Data:', data.slice(0, 1));
    }
  } catch (err) {
    console.error('SDK Crash:', err.message);
  }
}

checkData();
