INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260617090000-1.0.3',
  '1.0.3',
  'Guthaben und aufgeraeumte Dialoge',
  'SchuldKompass kann jetzt Guthaben fuer Schuldner verwalten, Zahlungen per Guthaben abwickeln und zeigt die Bewegungen in klaren Info-Dialogen.',
  ARRAY[
    'Guthaben fuer Schuldner vergeben und als Bezahlmethode nutzen',
    'Guthaben-Info als DataTable mit Herkunft, Verwendung und roten Minusbetraegen',
    'Mailversand fuer neues Guthaben und Zahlungen per Guthaben',
    'Schuldner-Dashboard mit eigener Guthabenbox und Detaildialog',
    'Dialoge, FloatLabels und Schulden-DataTables optisch vereinheitlicht'
  ]::TEXT[],
  '2026-06-17T09:00:00.000Z'
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "releasedAt" = EXCLUDED."releasedAt";
