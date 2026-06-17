CREATE TYPE "DebtCreditEntryType" AS ENUM ('GRANT', 'PAYMENT');

CREATE TABLE "DebtCredit" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "debtorName" TEXT NOT NULL,
    "debtorEmail" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtCredit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DebtCreditEntry" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "type" "DebtCreditEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "debtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtCreditEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DebtCredit_creatorId_debtorEmail_key" ON "DebtCredit"("creatorId", "debtorEmail");
CREATE INDEX "DebtCredit_creatorId_idx" ON "DebtCredit"("creatorId");
CREATE INDEX "DebtCredit_debtorEmail_idx" ON "DebtCredit"("debtorEmail");
CREATE INDEX "DebtCreditEntry_creditId_idx" ON "DebtCreditEntry"("creditId");
CREATE INDEX "DebtCreditEntry_debtId_idx" ON "DebtCreditEntry"("debtId");
CREATE INDEX "DebtCreditEntry_createdAt_idx" ON "DebtCreditEntry"("createdAt");

ALTER TABLE "DebtCredit"
ADD CONSTRAINT "DebtCredit_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DebtCreditEntry"
ADD CONSTRAINT "DebtCreditEntry_creditId_fkey"
FOREIGN KEY ("creditId") REFERENCES "DebtCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
