async function checkSecret() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'sb_secret_SRsnidbbg9KZOFv6fNKH_Q_O_zvfwxd'
      }
    });
    console.log('Status with Secret:', resp.status);
    const body = await resp.text();
    console.log('Body:', body.substring(0, 100));
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkSecret();
