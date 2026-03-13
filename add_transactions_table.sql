-- Create Transaction Ledger Table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "type" TEXT NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'CONTRIBUTION', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT'
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "referenceId" TEXT, -- ID of related payment, saving, or loan
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Keys if not already existing (conditional checks usually needed in complex DBs, but for fresh setup we just apply)
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_userId_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_groupId_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "transactions_groupId_idx" ON "transactions"("groupId");
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions"("type");
