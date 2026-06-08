INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608093000-0.1.4',
  '0.1.4',
  'E-Mail-Aktivierung und stabilerer Production-Deploy',
  'Neue Nutzer aktivieren ihr Konto per E-Mail-Link. Die Production-Pipeline fuehrt Prisma-Migrationen automatisch vor dem App-Start aus.',
  ARRAY[
    'E-Mail-Aktivierungslink fuer neue Nutzer',
    'Oeffentliche Aktivierungsseite mit automatischem Login nach Bestaetigung',
    'Login erst nach bestaetigter E-Mail-Adresse',
    'Prisma-Migrationen laufen beim Deploy automatisch',
    'Production-Compose nutzt Prisma statt einzelner Init-SQL-Mounts'
  ]::TEXT[],
  '2026-06-08T09:30:00.000Z'
);
