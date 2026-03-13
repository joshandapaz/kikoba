require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;
const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';

async function testClickPesa() {
    console.log('Testing ClickPesa Connection...');
    console.log('Using Client ID:', CLIENT_ID ? 'Set' : 'MISSING');
    console.log('Using API Key:', API_KEY ? 'Set' : 'MISSING');

    try {
        // 1. Get Token
        console.log('Generating Token...');
        const tokenRes = await fetch(`${BASE_URL}/third-parties/generate-token`, {
            method: 'POST',
            headers: {
                'client-id': CLIENT_ID,
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!tokenRes.ok) {
            console.error('Token Generation Failed:', await tokenRes.text());
            return;
        }

        const { token } = await tokenRes.json();
        console.log('Token Generated Successfully');

        // 2. Try a real (but small) collect
        // Use a dummy phone number or a specific one for testing
        // I will use a test format
        const testPhone = '255758100093'; // Using a TZ format
        console.log(`Attempting Mock Collect with ${testPhone}...`);

        const collectRes = await fetch(`${BASE_URL}/third-parties/payments/mobile-money/collect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100, // 100 TZS
                currency: 'TZS',
                external_id: 'TEST-' + Date.now(),
                phone_number: testPhone,
                description: 'Test Connection',
                callback_url: 'https://example.com/webhook'
            })
        });

        if (!collectRes.ok) {
            console.error('Collect Failed:', await collectRes.json());
        } else {
            console.log('Collect SUCCESS!', await collectRes.json());
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    }
}

testClickPesa();
