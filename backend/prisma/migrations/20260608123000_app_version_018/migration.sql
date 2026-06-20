INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608123000-0.1.8',
  '0.1.8',
  'Tests, Favicon und kompakter Versionsverlauf',
  'SchuldKompass bekommt erste automatisierte Basis-Tests, ein Favicon fuer die Dokumentation und einen kompakteren Versionsverlauf.',
  ARRAY[
    'Automatisierte Basis-Tests fuer Frontend und Backend',
    'Backend-Versionsvergleich in testbare Utility ausgelagert',
    'VitePress-Favicon ueber das SchuldKompass-Logo',
    'Versionsverlauf zeigt nur die letzten drei Versionen standardmaessig',
    'Aeltere Versionen bleiben per Aufklappen erreichbar'
  ]::TEXT[],
  '2026-06-08T12:30:00.000Z'
);
