require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testFinalVariations() {
    console.log('Testing Final Path/Method variations...');

    const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    const { token } = await tokenRes.json();

    const variants = [
        { path: '/third-parties/payments/mobile-money/collect', method: 'POST' },
        { path: '/third-parties/payments/mobile-money/collect/', method: 'POST' },
        { path: '/third-parties/payouts/create-mobile-money-payout', method: 'POST' },
        { path: '/third-parties/payouts/create-mobile-money-payout/', method: 'POST' }
    ];

    for (const v of variants) {
        const url = `https://api.clickpesa.com${v.path}`;
        const res = await fetch(url, {
            method: v.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'TZS',
                external_id: 'FIN-' + Date.now(),
                phone_number: '255683267434',
                description: 'Final Test'
            })
        });
        const body = await res.json();
        console.log(`URL: ${v.path} | Status: ${res.status} | Body Keys: ${Object.keys(body)}`);
        if (res.status === 201 || (res.status === 200 && !body.status)) {
             console.log('SUCCESS AT:', v.path);
        }
    }
}

testFinalVariations();
