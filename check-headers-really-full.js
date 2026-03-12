async function checkAllHeaders() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'sb_secret_SRsnidbbg9KZOFv6fNKH_Q_O_zvfwxd'
      }
    });
    console.log('--- All Headers ---');
    resp.headers.forEach((v, k) => console.log(`${k}: ${v}`));
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkAllHeaders();
