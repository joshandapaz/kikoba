import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function runSQL() {
  const client = new Client({
    connectionString: 'postgresql://postgres.bggiguzhkdxfwgfbuqfy:0758100093Dapaz@db.bggiguzhkdxfwgfbuqfy.supabase.co:5432/postgres',
  })

  await client.connect()

  try {
    console.log('Adding provider column if it does not exist...')
    await client.query(`
      ALTER TABLE public.payments
      ADD COLUMN IF NOT EXISTS provider text DEFAULT 'AZAMPAY';
    `)
    console.log('Success!')
  } catch (err) {
    console.error('Error running SQL:', err)
  } finally {
    await client.end()
  }
}

runSQL()
