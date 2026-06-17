CREATE TYPE "DebtPaymentStatus" AS ENUM ('PENDING', 'REJECTED');

ALTER TABLE "Debt"
ADD COLUMN "paymentStatus" "DebtPaymentStatus",
ADD COLUMN "paymentReason" TEXT,
ADD COLUMN "paymentRequestedAt" TIMESTAMP(3),
ADD COLUMN "paymentRejectedAt" TIMESTAMP(3);

CREATE INDEX "Debt_paymentStatus_idx" ON "Debt"("paymentStatus");

INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260614130000-1.0.2',
  '1.0.2',
  'Kompaktere Schuldenansichten',
  'Die Schuldentabellen wurden weiter verschlankt, die Aktionsmenues vereinheitlicht und der Schuld-erfassen-Dialog wieder mit einem klaren Footer versehen.',
  ARRAY[
    'Einheitliche Aktionsmenues fuer offene, eigene und bezahlte Eintraege',
    'Schuld-erfassen-Dialog mit sichtbarem Footer',
    'DataTable-Umbau fuer die Bereiche "Ich schulde" und "Von mir bezahlt"',
    'Bezahlte Schulden mit stabilerer Zeilenhoehe'
  ]::TEXT[],
  '2026-06-14T13:00:00.000Z'
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "releasedAt" = EXCLUDED."releasedAt";
