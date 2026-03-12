const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bggiguzhkdxfwgfbuqfy.supabase.co',
  'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'
);

async function testSDK() {
  try {
    const { data, error, status } = await supabase.from('User').select('*', { count: 'exact', head: true });
    console.log('Status:', status);
    if (error) {
      console.log('SDK Error:', error.message);
      console.log('Error Details:', error);
    } else {
      console.log('SDK Success!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('SDK Crash:', err.message);
  }
}

testSDK();
