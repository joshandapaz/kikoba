
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addColumn() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const query = 'ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;';
    await client.query(query);
    console.log('Successfully added avatar_url column to users table');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Column avatar_url already exists');
    } else {
      console.error('Error adding column:', err.message);
    }
  } finally {
    await client.end();
  }
}

addColumn();
