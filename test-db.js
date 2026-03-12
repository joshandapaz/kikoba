const { Client } = require('pg');
const connectionString = 'postgresql://postgres:%400758100093Dapaz@db.bggiguzhkdxfwgfbuqfy.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
