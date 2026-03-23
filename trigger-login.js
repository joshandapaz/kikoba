async function triggerLogin() {
    const url = 'http://localhost:5172/api/auth/callback/credentials';
    console.log(`Triggering login via ${url}...`);
    
    // We need CSRF token first
    const csrfRes = await fetch('http://localhost:5172/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    console.log('CSRF Token:', csrfToken);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            phone: '+255683267434',
            password: 'password123',
            csrfToken: csrfToken,
            json: 'true'
        })
    });

    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log('Response:', text);
}

triggerLogin();
