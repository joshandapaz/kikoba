require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testCollectFinal() {
    console.log('Testing Collect with Payout-style params...');

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

    // Based on Payout errors: order_reference (or orderReference), phone_number without plus
    // We'll try both common naming conventions
    const payloads = [
        {
            amount: 100,
            currency: 'TZS',
            order_reference: 'FIN-COL-' + Date.now(),
            phone_number: '255683267434',
            description: 'Final Test'
        },
        {
            amount: 100,
            currency: 'TZS',
            orderReference: 'FIN-COL-CAMEL-' + Date.now(),
            phoneNumber: '255683267434',
            description: 'Final Test Camel'
        },
         {
            amount: 100,
            currency: 'TZS',
            external_id: 'FIN-COL-EXT-' + Date.now(),
            phone_number: '255683267434',
            description: 'Final Test Ext'
        }
    ];

    for (const payload of payloads) {
        console.log(`--- Testing Payload: ${JSON.stringify(payload).substring(0, 50)}... ---`);
        const res = await fetch('https://api.clickpesa.com/third-parties/payments/mobile-money/collect', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const body = await res.json();
        console.log('Status:', res.status);
        if (body.status === 'up') {
             console.log('STILL HEALTHCHECK');
        } else {
             console.log('RESULT:', JSON.stringify(body, null, 2));
        }
    }
}

testCollectFinal();
