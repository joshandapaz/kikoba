require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testHeaderAuth() {
    console.log('Testing Header-only Auth (no token)...');

    const res = await fetch('https://api.clickpesa.com/third-parties/payments/mobile-money/collect', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 100,
            currency: 'TZS',
            external_id: 'HDR-ONLY-' + Date.now(),
            phone_number: '255683267434',
            description: 'Header Only Test',
            callback_url: 'https://example.com'
        })
    });

    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Body Keys:', Object.keys(body));
    
    const isHealthCheck = (body.status === 'up' && body.version);
    if (isHealthCheck) {
        console.log('FAILURE: Still hitting healthcheck.');
    } else {
        console.log('RESULT:', JSON.stringify(body, null, 2));
    }
}

testHeaderAuth();
