require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testPushConfirmed() {
    console.log('Testing CONFIRMED ClickPesa Push Endpoint...');

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

    // Correct path from documentation research
    const path = '/third-parties/payments/initiate-ussd-push-request';
    const url = `https://api.clickpesa.com${path}`;
    
    console.log(`Targeting: ${url}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 100,
            currency: 'TZS',
            phone_number: '255683267434', // No plus sign as per payout API discovery
            order_reference: 'CONF-' + Date.now(), // Documentation likely uses order_reference
            description: 'Confirmed Endpoint Test',
            callback_url: 'https://example.com/webhook'
        })
    });

    const body = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(body, null, 2));

    if (res.status === 202 || res.status === 201 || res.status === 200) {
        if (!body.version) {
             console.log('SUCCESS! Real endpoint reached.');
        } else {
             console.log('STILL HEALTHCHECK (Check path prefix/routing)');
        }
    }
}

testPushConfirmed();
