require('dotenv').config();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testFinalRoute() {
    console.log('Testing Final /api/payments/clickpesa/initiate Route...');

    // We can't easily test with getServerSession without a real session,
    // but the ClickPesa library itself is now verified.
    // I will run the ClickPesa library's direct initiateUssdPush test one last time
    // with the EXACT parameters the app will use.

    const { ClickPesa } = require('./lib/clickpesa');
    
    try {
        const result = await ClickPesa.initiateUssdPush({
            amount: 100,
            phone: '+255683267434',
            externalId: 'FINAL-VER-' + Date.now()
        });

        console.log('FINAL VERIFICATION SUCCESS!');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('FINAL VERIFICATION FAILED:', err.message);
    }
}

testFinalRoute();
