require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testPayout() {
    console.log('Testing Payout endpoint...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    const { token: rawToken } = await tokenRes.json();
    const token = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;

    const res = await fetch('https://api.clickpesa.com/third-parties/payouts/create-mobile-money-payout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 10,
            currency: 'TZS',
            external_id: 'PAY-' + Date.now(),
            phone_number: '255683267434',
            description: 'Payout Test'
        })
    });

    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(body, null, 2));
}

testPayout();
