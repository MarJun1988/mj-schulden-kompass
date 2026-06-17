INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608110000-0.1.5',
  '0.1.5',
  'Ruhigere Navigation und moderneres Nutzermenue',
  'Die Hauptnavigation ist auf die wichtigsten Bereiche reduziert. Version und Darstellung sind jetzt dezent im Nutzermenue erreichbar.',
  ARRAY[
    'Hauptnavigation ohne eigenen Versionspunkt',
    'Aktuelle Version dezent im Nutzermenue verlinkt',
    'Darstellungsauswahl als kompakter Dialog fuer System, Hell und Dunkel',
    'Versionsverlauf bleibt direkt aus dem Account-Menue erreichbar',
    'VitePress-Hilfe verlinkt zurueck in die Anwendung'
  ]::TEXT[],
  '2026-06-08T11:00:00.000Z'
);
