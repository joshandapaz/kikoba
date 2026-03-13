require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testPushEndpointsDetailed() {
    console.log('Testing NEW ClickPesa Endpoints (Detailed)...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    const { token } = await tokenRes.json();
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

    const endpoints = [
        '/payments/preview-ussd-push',
        '/payments/initiate-ussd-push'
    ];

    for (const path of endpoints) {
        const url = `https://api.clickpesa.com${path}`;
        console.log(`Checking ${url}...`);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'TZS',
                phone_number: '255683267434',
                external_id: 'DET-' + Date.now(),
                description: 'Detailed Test'
            })
        });

        const body = await res.json();
        console.log(`Path: ${path} | Status: ${res.status}`);
        if (body.status === 'up') {
             console.log('STILL HEALTHCHECK');
        } else {
             console.log('--- FOUND NON-HEALTHCHECK RESPONSE! ---');
             console.log(JSON.stringify(body, null, 2));
        }
    }
}

testPushEndpointsDetailed();
