require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testVariations() {
    console.log('Testing ClickPesa Path Variations...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    const { token } = await tokenRes.json();
    console.log('Token ready.');

    const variations = [
        '/third-parties/payments/mobile-money/collect',
        '/v1/third-parties/payments/mobile-money/collect',
        '/api/third-parties/payments/mobile-money/collect',
        '/payments/mobile-money/collect',
        '/v1/payments/mobile-money/collect'
    ];

    for (const path of variations) {
        const url = `https://api.clickpesa.com${path}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: 10,
                    currency: 'TZS',
                    external_id: 'VAR-' + Date.now(),
                    phone_number: '255683267434',
                    description: 'Path Test',
                    callback_url: 'https://example.com'
                })
            });

            const body = await res.json();
            console.log(`Path: ${path} | Status: ${res.status} | Body Keys: ${Object.keys(body)}`);
            if (res.status === 201 || (res.status === 200 && !body.status)) {
                console.log('--- FOUND POTENTIAL SUCCESS OR DIFFERENT RESPONSE ---');
                console.log(JSON.stringify(body, null, 2));
            }
        } catch (e) {
            console.log(`Path: ${path} | FAILED: ${e.message}`);
        }
    }
}

testVariations();
