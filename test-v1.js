require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;
// Testing with /v1
const BASE_URL = 'https://api.clickpesa.com/v1';

async function testV1() {
    console.log(`Testing ClickPesa V1 at ${BASE_URL}...`);

    try {
        // 1. Get Token (Maybe token endpoint also needs v1 or stays at root?)
        // Let's try root first as it worked before
        const tokenRes = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
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
        console.log('Token Generated');

        // 2. Try to list channels with v1
        const channelsRes = await fetch(`${BASE_URL}/third-parties/payments/mobile-money/channels`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await channelsRes.json();
        console.log('V1 Channels Response Status:', channelsRes.status);
        if (channelsRes.status === 200 && !result.name) {
             console.log('V1 Channels Body:', JSON.stringify(result, null, 2));
        } else {
             console.log('V1 Channels returned health check or error:', JSON.stringify(result, null, 2));
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

testV1();
