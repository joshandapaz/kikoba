const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bggiguzhkdxfwgfbuqfy.supabase.co',
  'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'
);

async function testSDK() {
  try {
    const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('SDK Error:', error.message);
    } else {
      console.log('SDK Success!');
    }
  } catch (err) {
    console.error('SDK Crash:', err.message);
  }
}

testSDK();
