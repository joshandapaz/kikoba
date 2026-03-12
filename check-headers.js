async function checkHeaders() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'
      }
    });
    console.log('--- Headers ---');
    for (const [key, value] of resp.headers.entries()) {
      if (key.includes('region') || key.includes('via') || key.includes('cf') || key.includes('ray') || key.includes('location')) {
        console.log(`${key}: ${value}`);
      }
    }

  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkHeaders();
