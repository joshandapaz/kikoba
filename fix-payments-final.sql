-- Clean up and standardize the payments table
-- This script ensures all required columns exist with the correct names

-- 1. Drop if it's very messy (Optional, but safer if columns are totally wrong)
-- ALTER TABLE IF EXISTS "payments" RENAME TO "payments_old_backup";

-- 2. Create or Update table to be exactly what we need
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'payments') THEN
        CREATE TABLE "payments" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
            "userId" TEXT NOT NULL REFERENCES "users"("id"),
            "amount" DOUBLE PRECISION NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "merchant_reference" TEXT UNIQUE NOT NULL,
            "order_tracking_id" TEXT,
            "metadata" JSONB DEFAULT '{}'::jsonb,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Fix existing columns
        
        -- userId
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='user_id') THEN
            ALTER TABLE "payments" RENAME COLUMN "user_id" TO "userId";
        END IF;

        -- merchant_reference
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='merchant_reference') THEN
            ALTER TABLE "payments" ADD COLUMN "merchant_reference" TEXT;
            ALTER TABLE "payments" ADD CONSTRAINT "payments_merchant_reference_key" UNIQUE ("merchant_reference");
        END IF;

        -- amount
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='amount') THEN
            ALTER TABLE "payments" ADD COLUMN "amount" DOUBLE PRECISION DEFAULT 0;
        END IF;

        -- status
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='status') THEN
            ALTER TABLE "payments" ADD COLUMN "status" TEXT DEFAULT 'PENDING';
        END IF;

        -- metadata
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='metadata') THEN
            ALTER TABLE "payments" ADD COLUMN "metadata" JSONB DEFAULT '{}'::jsonb;
        END IF;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
