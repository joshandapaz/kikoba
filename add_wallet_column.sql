-- Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "wallet_balance" DOUBLE PRECISION DEFAULT 0;
