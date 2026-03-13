
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database to set policies...');
    await client.connect();
    
    // Enable storage policies for 'profiles' bucket
    // 1. SELECT for everyone
    // 2. INSERT for anyone (simplest for now to unblock)
    // 3. UPDATE for anyone
    
    const sql = `
      -- 1. Select policy
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Select' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
        END IF;
      END
      $$;

      -- 2. Insert policy
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profiles');
        END IF;
      END
      $$;

      -- 3. Update policy
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
          CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'profiles');
        END IF;
      END
      $$;
    `;

    console.log('Running SQL policies...');
    await client.query(sql);
    console.log('Storage policies created or already exist.');

  } catch (err) {
    console.error('Error:', err.message);
    // If it fails, we at least tried
  } finally {
    await client.end();
  }
}

run();
