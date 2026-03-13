require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function testBillPayPaths() {
    console.log('Testing BillPay Paths...');

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

    const paths = [
        '/third-parties/billpays/collect',
        '/third-parties/billpays/initiate-ussd-push',
        '/third-parties/bill-pay/collect',
        '/v1/bill-pay/collect',
        '/bill-pays/collect',
        '/third-parties/payments/mobile-money/collect-v1'
    ];

    for (const path of paths) {
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
                    order_reference: 'BP-' + Date.now(),
                    phone_number: '255683267434',
                    description: 'BillPay Test'
                })
            });

            const body = await res.json();
            const isHealthCheck = (body.status === 'up' && body.version);

            if (!isHealthCheck) {
                console.log(`[FOUND!] Path: ${path} | Status: ${res.status}`);
                console.log('Body Keys:', Object.keys(body));
                if (res.status < 500) {
                     console.log(JSON.stringify(body, null, 2));
                }
            }
        } catch (e) {
            // console.log(`[FAIL] ${path}`);
        }
    }
}

testBillPayPaths();
