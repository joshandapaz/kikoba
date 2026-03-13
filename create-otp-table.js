const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://postgres.bggiguzhkdxfwgfbuqfy:0758100093Dapaz@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
async function run() {
  try {
    await client.connect();
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
    `;
    await client.query(sql);
    console.log('Success');
  } catch (err) { console.error(err.message); } finally { await client.end(); }
}
run();
