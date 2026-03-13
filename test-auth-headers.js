require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testAuthHeaders() {
    console.log('Testing Auth Header variations...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    const { token } = await tokenRes.json();

    const authHeaders = [
        `Bearer ${token}`,
        token
    ];

    for (const auth of authHeaders) {
        console.log(`Testing with header: ${auth.substring(0, 10)}...`);
        const res = await fetch('https://api.clickpesa.com/third-parties/payments/mobile-money/collect', {
            method: 'POST',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'TZS',
                external_id: 'AUTH-' + Date.now(),
                phone_number: '255683267434',
                description: 'Auth Test'
            })
        });

        const body = await res.json();
        console.log(`Status: ${res.status} | Body Keys: ${Object.keys(body)}`);
    }
}

testAuthHeaders();
