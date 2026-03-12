async function checkUserTable() {
  try {
    const resp = await fetch('https://bggiguzhkdxfwgfbuqfy.supabase.co/rest/v1/users?select=count', {

      method: 'GET',
      headers: {
        'apikey': 'sb_secret_SRsnidbbg9KZOFv6fNKH_Q_O_zvfwxd'
      }
    });
    console.log('Status:', resp.status);
    const body = await resp.text();
    console.log('Body:', body);
    if (resp.status === 200) {
      console.log('SUCCESS: User table exists!');
    } else if (body.includes('not found')) {
      console.log('REASON: User table does not exist.');
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
checkUserTable();
