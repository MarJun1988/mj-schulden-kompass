INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260617123000-1.0.4',
  '1.0.4',
  'Guthaben zurueckueberweisen',
  'SchuldKompass kann vorhandenes Guthaben jetzt als Rueckueberweisung reduzieren, ohne daraus eine neue Schuld zu erzeugen.',
  ARRAY[
    'Guthaben als Rueckueberweisung erfassen',
    'Rueckueberweisung als eigene Guthabenbewegung anzeigen',
    'Mailbenachrichtigung fuer zurueckueberwiesenes Guthaben',
    'Guthaben bleibt nachvollziehbar getrennt von Schulden und Guthaben-Zahlungen'
  ]::TEXT[],
  '2026-06-17T12:30:00.000Z'
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "releasedAt" = EXCLUDED."releasedAt";
