require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;
const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';

async function testChannels() {
    console.log('Testing ClickPesa Channels...');

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
        
        // 2. Try to list channels
        const channelsRes = await fetch(`${BASE_URL}/third-parties/payments/mobile-money/channels`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await channelsRes.json();
        console.log('Channels Response Status:', channelsRes.status);
        console.log('Channels Body:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

testChannels();
