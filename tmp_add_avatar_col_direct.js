
const { Client } = require('pg');

async function run() {
  // Trying direct connection string (no pooler)
  const connectionString = "postgresql://postgres.bggiguzhkdxfwgfbuqfy:0758100093Dapaz@db.bggiguzhkdxfwgfbuqfy.supabase.co:5432/postgres";
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to direct database host...');
    await client.connect();
    console.log('Connected. Running ALTER TABLE...');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;');
    
    console.log('Column "avatar_url" added successfully.');
  } catch (err) {
    console.error('Full Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
