const { Client } = require('pg');

const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-central-1', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2', 'af-south-1'];
const password = '@0758100093Dapaz';

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking ${region}...`);
    const client = new Client({
      connectionString: `postgresql://postgres.bggiguzhkdxfwgfbuqfy:${encodeURIComponent(password)}@${host}:6543/postgres?pgbouncer=true`,
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log(`SUCCESS: Connected to ${region}!`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed ${region}: ${err.message}`);
    }
  }
}

testRegions();
