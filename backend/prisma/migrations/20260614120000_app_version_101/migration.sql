INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260614120000-1.0.1',
  '1.0.1',
  'Stabilere Tabellenansicht',
  'Die Schulden- und Auswertungsansicht haben festere Spalten, ruhigere Zeilen und springen beim Tab-Wechsel nicht mehr.',
  ARRAY[
    'Schuldenansicht mit festen Spaltenbreiten',
    'Bezahlte Schulden mit ruhigerer Zeilenhoehe',
    'Schuldner-nach-Kategorie-Auswertung als Tabs',
    'Kompaktere Darstellung bei langen Namen und Kommentaren'
  ]::TEXT[],
  '2026-06-14T12:00:00.000Z'
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "releasedAt" = EXCLUDED."releasedAt";
