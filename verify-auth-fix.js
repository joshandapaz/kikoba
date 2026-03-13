require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function verifyAuthFix() {
    console.log('Verifying ClickPesa Auth Fix...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    const { token: rawToken } = await tokenRes.json();
    console.log('Raw Token Prefix:', rawToken.substring(0, 15));

    // Fix: Remove "Bearer " if present
    const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;

    const res = await fetch('https://api.clickpesa.com/third-parties/payments/mobile-money/collect', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 100,
            currency: 'TZS',
            external_id: 'FIX-VER-' + Date.now(),
            phone_number: '255683267434',
            description: 'Fix Verification',
            callback_url: 'https://example.com'
        })
    });

    const body = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body Keys:', Object.keys(body));
    
    // If we see "status" or something similar, it might be working.
    // If we see "version" and "status: up", it's still routing to healthcheck.
    const isHealthCheck = (body.status === 'up' && body.version);
    if (isHealthCheck) {
        console.log('FAILURE: Still hitting healthcheck.');
    } else {
        console.log('SUCCESS: Hit a real endpoint!');
        console.log(JSON.stringify(body, null, 2));
    }
}

verifyAuthFix();
