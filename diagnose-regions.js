import { createClient } from '@libsql/client'; // This was for SQLite, for PG we use pg

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'af-south-1', 'ap-east-1', 'ap-south-1', 'ap-northeast-3',
  'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ca-central-1', 'eu-central-1',
  'eu-west-1', 'eu-west-2', 'eu-south-1', 'eu-west-3',
  'eu-north-1', 'me-south-1', 'sa-east-1'
];

const projectRef = 'bggiguzhkdxfwgfbuqfy';

async function checkPoolers() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking ${region} (${host})...`);
    // We can't easily check 'Tenant not found' without trying to connect, 
    // but nslookup can at least tell us if the host exists.
  }
}
