INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "releasedAt",
  "createdAt"
)
VALUES (
  '20260608133000-1.0.0',
  '1.0.0',
  'Stabiler erster Release',
  'SchuldKompass ist bereit fuer den stabilen Betrieb mit Auth, Schuldenverwaltung, Auswertung, E-Mail-Funktionen, Hilfe, Testing-Deploy und Production-Deploy.',
  '2026-06-08 13:30:00',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "releasedAt" = EXCLUDED."releasedAt";
