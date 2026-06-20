CREATE TYPE "MailDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

CREATE TABLE "QueuedMail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "status" "MailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 10,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueuedMail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QueuedMail_status_nextAttemptAt_idx" ON "QueuedMail"("status", "nextAttemptAt");
CREATE INDEX "QueuedMail_lockedAt_idx" ON "QueuedMail"("lockedAt");
CREATE INDEX "QueuedMail_createdAt_idx" ON "QueuedMail"("createdAt");
