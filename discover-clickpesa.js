require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function discoverEndpoints() {
    console.log('--- ClickPesa Endpoint Discovery ---');

    // 1. Get Token
    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!tokenRes.ok) {
        console.error('Initial Token Generation Failed');
        return;
    }

    const tokenData = await tokenRes.json();
    console.log('Token Response:', JSON.stringify(tokenData, null, 2));
    const token = tokenData.token;

    // 2. Test Variations for 'Collection'
    // Common ClickPesa prefix variations
    const prefixes = ['', '/v1', '/api', '/v2'];
    const paths = [
        '/third-parties/payments/mobile-money/collect',
        '/payments/mobile-money/collect',
        '/payments/initiate-ussd-push',
        '/payments/mobile-money/ussd-push',
        '/collect'
    ];

    for (const prefix of prefixes) {
        for (const path of paths) {
            const url = `https://api.clickpesa.com${prefix}${path}`;
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
                        external_id: 'DISC-' + Date.now(),
                        phone_number: '255683267434',
                        description: 'Discovery Test'
                    })
                });

                const body = await res.json();
                const isHealthCheck = (body.status === 'up' && body.version);
                
                if (!isHealthCheck) {
                    console.log(`[SUCCESS/MATCH] URL: ${url} | Status: ${res.status}`);
                    console.log('Response:', JSON.stringify(body, null, 2));
                    console.log('-----------------------------------');
                } else {
                    // console.log(`[HEALTHCHECK] URL: ${url}`);
                }

            } catch (e) {
                // console.log(`[ERROR] URL: ${url} | ${e.message}`);
            }
        }
    }
}

discoverEndpoints();
