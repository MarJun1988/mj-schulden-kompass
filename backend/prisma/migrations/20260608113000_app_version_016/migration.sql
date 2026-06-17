INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608113000-0.1.6',
  '0.1.6',
  'Stabilerer Release-Check',
  'Die GitHub-Release-Pruefung blockiert das Backend nicht mehr dauerhaft, wenn GitHub nicht erreichbar ist.',
  ARRAY[
    'Release-Pruefung mit kurzem Timeout',
    'Release-Pruefung per Env deaktivierbar',
    'Production-Compose uebergibt Release-Check-Optionen ans Backend',
    'Defensiveres GraphQL-Logging fuer Healthchecks'
  ]::TEXT[],
  '2026-06-08T11:30:00.000Z'
);
