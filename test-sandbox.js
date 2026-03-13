require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;
const SANDBOX_URL = 'https://api.sandbox.clickpesa.com';

async function testSandbox() {
    console.log('Testing ClickPesa SANDBOX...');

    try {
        const tokenRes = await fetch(`${SANDBOX_URL}/third-parties/generate-token`, {
            method: 'POST',
            headers: {
                'client-id': CLIENT_ID,
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!tokenRes.ok) {
            console.error('Sandbox Token Generation Failed:', await tokenRes.text());
            return;
        }

        const { token } = await tokenRes.json();
        console.log('Sandbox Token Generated');

        const collectRes = await fetch(`${SANDBOX_URL}/third-parties/payments/mobile-money/collect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'TZS',
                external_id: 'SBX-' + Date.now(),
                phone_number: '255683267434',
                description: 'Sandbox Test',
                callback_url: 'https://example.com'
            })
        });

        const result = await collectRes.json();
        console.log('Sandbox Status:', collectRes.status);
        console.log('Sandbox Body:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

testSandbox();
