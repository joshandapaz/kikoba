-- Add metadata column to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;
