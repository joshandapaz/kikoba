require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function brutePaths() {
    console.log('Brute-forcing ClickPesa Collection Paths...');

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

    const basePaths = [
        '/third-parties/payments/mobile-money',
        '/third-parties/mobile-money',
        '/third-parties/payments',
        '/v1/third-parties/payments/mobile-money',
        '/api/v1/payments/mobile-money'
    ];

    const actions = [
        '/collect',
        '/collection',
        '/push',
        '/ussd-push',
        '/initiate',
        '/request-payment',
        '/collect-mobile-money',
        '/create'
    ];

    for (const b of basePaths) {
        for (const a of actions) {
            const path = b + a;
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
                        order_reference: 'BRUTE-' + Date.now(),
                        phone_number: '255683267434',
                        description: 'Brute Test'
                    })
                });

                const body = await res.json();
                const isHealthCheck = (body.status === 'up' && body.version);

                if (!isHealthCheck) {
                    console.log(`[MATCH FOUND!] Path: ${path} | Status: ${res.status}`);
                    console.log('Body:', JSON.stringify(body, null, 2));
                    console.log('-----------------------------------');
                }
            } catch (e) {
                // console.log(`[FAIL] Path: ${path}`);
            }
        }
    }
}

brutePaths();
