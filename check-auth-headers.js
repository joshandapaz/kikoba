async function checkAuthHeaders() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/auth/v1/settings', {
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'
      }
    });
    console.log('--- Auth Headers ---');
    resp.headers.forEach((v, k) => console.log(`${k}: ${v}`));
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkAuthHeaders();
