-- 1. Enable the required extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure the 'id' columns have the correct default value
-- We use 'uuid_generate_v4()::text' which is the standard for Supabase

ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "groups" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "group_members" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "savings" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "loans" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "loan_votes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "loan_payments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE "activities" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()::text;

-- 3. Verify it works by checking the table info (optional, just for your info)
-- SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';
