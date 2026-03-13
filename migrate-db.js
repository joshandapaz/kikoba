const { Client } = require('pg');
const client = new Client({ 
  connectionString: "postgresql://postgres.bggiguzhkdxfwgfbuqfy:0758100093Dapaz@db.bggiguzhkdxfwgfbuqfy.supabase.co:5432/postgres" 
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = `
      CREATE TABLE IF NOT EXISTS "otp_verifications" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
          "phone" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "otp_verifications_phone_idx" ON "otp_verifications"("phone");

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key') THEN
          ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");
        END IF;
      END $$;
    `;
    await client.query(sql);
    console.log('Migration Completed Successfully');
  } catch (err) { 
    console.error('Migration Failed:', err.message); 
  } finally { 
    await client.end(); 
  }
}
run();
