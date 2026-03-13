require('dotenv').config();

const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const API_KEY = process.env.CLICKPESA_API_KEY;

async function decodeToken() {
    console.log('Fetching and Decoding ClickPesa Token...');

    const res = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
        method: 'POST',
        headers: {
            'client-id': CLIENT_ID,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    const { token: rawToken } = await res.json();
    const token = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;

    console.log('Encoded Token:', token);

    // Decode JWT payload (middle part)
    const payload = token.split('.')[1];
    if (payload) {
        const decoded = Buffer.from(payload, 'base64').toString('utf8');
        console.log('Decoded Payload:', JSON.stringify(JSON.parse(decoded), null, 2));
    } else {
        console.log('Not a valid JWT structure.');
    }
}

decodeToken();
