INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608130000-0.1.9',
  '0.1.9',
  'Automatisches Version-Update im Deploy',
  'Die Deploy-Jobs schreiben die auszurollende Version automatisch in .env.production und erstellen Container sichtbar neu.',
  ARRAY[
    'Deploy aktualisiert VERSION in .env.production automatisch',
    'Production nutzt den Git-Tag als Image-Version',
    'Testing nutzt den Build-Tag mit Commit-Hash',
    'Deploy-Logs zeigen Pull, Migration, Recreate und Containerstatus',
    'Container werden mit --force-recreate neu erstellt'
  ]::TEXT[],
  '2026-06-08T13:00:00.000Z'
);
