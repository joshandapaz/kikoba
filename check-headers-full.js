async function checkHeaders() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'
      }
    });
    console.log('Status:', resp.status);
    console.log('--- All Headers ---');
    for (const [key, value] of resp.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkHeaders();
