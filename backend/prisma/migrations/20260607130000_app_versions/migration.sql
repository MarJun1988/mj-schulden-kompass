CREATE TABLE "AppVersion" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "notes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "releasedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppVersion_version_key" ON "AppVersion"("version");
CREATE INDEX "AppVersion_releasedAt_idx" ON "AppVersion"("releasedAt");

INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260607130000-0.1.0',
  '0.1.0',
  'Erste SchuldKompass Version',
  'Grundversion mit Auth, Schuldenverwaltung, Löschanträgen, Auswertung, Dokumentation und Docker-Setup.',
  ARRAY[
    'Vue 3 Frontend mit PrimeVue, Tailwind CSS, Pinia und Vue Router',
    'GraphQL Backend mit Prisma, PostgreSQL und JWT-Auth',
    'Schulden erfassen, bearbeiten, bezahlen und löschen',
    'Löschanträge mit Begründung und Freigabe durch den Besitzer',
    'Kategorie-Auswertung und moderne Light/Dark-Farbwelt'
  ]::TEXT[],
  '2026-06-07T13:00:00.000Z'
);
