const { Client } = require('pg');
require('dotenv').config();

async function testDirect5432() {
  // Construct direct URL: postgresql://postgres.[project-id]:[password]@db.[project-id].supabase.co:5432/postgres
  const projectId = 'bggiguzhkdxfwgfbuqfy';
  const password = '0758100093Dapaz';
  const directUrl = `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`;
  
  console.log('Connecting to:', directUrl);

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('SUCCESS: Connected to Direct PG (5432)');
    const res = await client.query("SELECT true as ok");
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('FAILED (5432):', err.message);
  } finally {
    await client.end();
  }
}

testDirect5432();
