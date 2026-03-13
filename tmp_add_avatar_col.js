
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL missing in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Running ALTER TABLE...');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;');
    
    console.log('Column "avatar_url" added successfully (or already existed).');
  } catch (err) {
    console.error('Error executing query:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
