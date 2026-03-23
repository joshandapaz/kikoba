async function checkAuth() {
    const url = 'http://localhost:5172/api/auth/session';
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response length: ${text.length}`);
        console.log('Body:', text.substring(0, 100));
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}
checkAuth();
