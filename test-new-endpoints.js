require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testNewEndpoints() {
    console.log('Testing NEW ClickPesa Endpoints...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!tokenRes.ok) {
        console.error('Token Failed');
        return;
    }
    const { token } = await tokenRes.json();

    const endpoints = [
        '/payments/preview-ussd-push',
        '/payments/initiate-ussd-push',
        '/v1/payments/preview-ussd-push',
        '/v1/payments/initiate-ussd-push'
    ];

    for (const path of endpoints) {
        const url = `https://api.clickpesa.com${path}`;
        try {
            console.log(`Checking ${path}...`);
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: 100,
                    currency: 'TZS',
                    phone_number: '255683267434',
                    external_id: 'NEW-' + Date.now(),
                    description: 'New Endpoint Test'
                })
            });

            const body = await res.json();
            console.log(`Path: ${path} | Status: ${res.status}`);
            if (res.status < 400 && !body.name) {
                console.log('--- POTENTIAL MATCH ---');
                console.log(JSON.stringify(body, null, 2));
            }
        } catch (e) {
            console.log(`Path: ${path} | Error: ${e.message}`);
        }
    }
}

testNewEndpoints();
