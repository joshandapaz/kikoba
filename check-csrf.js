async function checkCsrf() {
    const url = 'http://localhost:5172/api/auth/csrf';
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}
checkCsrf();
