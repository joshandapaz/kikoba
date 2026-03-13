require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;
const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';

async function testUssdPush() {
    const testPhone = '+255683267434';
    console.log(`--- DIRECT USSD TEST FOR ${testPhone} ---`);

    try {
        // 1. Get Token
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
        
        // 2. Format Phone (ClickPesa often wants pure digits, starting with 255)
        let formattedPhone = testPhone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) formattedPhone = '255' + formattedPhone.substring(1);
        
        console.log('Formatted Phone:', formattedPhone);

        const body = {
            amount: 100,
            currency: 'TZS',
            external_id: 'DIRECT-' + Date.now(),
            phone_number: formattedPhone,
            description: 'Direct Test Push',
            callback_url: 'https://example.com/webhook'
        };

        const collectRes = await fetch(`${BASE_URL}/third-parties/payments/mobile-money/collect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await collectRes.json();
        console.log('Response Status:', collectRes.status);
        console.log('Response Body:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

testUssdPush();
