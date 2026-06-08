-- CreateEnum
CREATE TYPE "DebtDeletionStatus" AS ENUM ('PENDING', 'REJECTED');

-- AlterTable
ALTER TABLE "Debt"
ADD COLUMN "deletionStatus" "DebtDeletionStatus",
ADD COLUMN "deletionReason" TEXT,
ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN "deletionRejectedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Debt_deletionStatus_idx" ON "Debt"("deletionStatus");
