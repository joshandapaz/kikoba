const { Client } = require('pg');
require('dotenv').config();

async function testDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PG');

    const res = await client.query("INSERT INTO payments (amount, userId, merchant_reference, status) VALUES (777, (SELECT id FROM users LIMIT 1), 'DIRECT-TEST', 'PENDING') RETURNING id");
    console.log('Direct Insert Success:', res.rows[0]);
  } catch (err) {
    console.error('Direct Insert Failed:', err.message);
  } finally {
    await client.end();
  }
}

testDirect();
