INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260620104500-1.0.5',
  '1.0.5',
  'Monitoring und zuverlaessiger Mailversand',
  'SchuldKompass ueberwacht Backend-Metriken und Docker-Logs in Grafana und stellt fehlgeschlagene E-Mails ueber eine persistente Retry-Queue erneut zu.',
  ARRAY[
    'Persistente Mail-Queue mit konfigurierbarem Retry-Intervall und maximalen Versuchen',
    'SMTP-Timeouts fuer Verbindungsaufbau, Begruessung und Socket',
    'Prometheus-Metriken fuer GraphQL, Fehler, Laufzeiten und Mail-Zustaende',
    'Grafana-Dashboard fuer Backend-Metriken und Docker-Logs',
    'Loki und Grafana Alloy fuer Logs aller Container in Local, Testing und Production',
    'Log-Filter nach Docker-Service, Level und Freitext'
  ]::TEXT[],
  '2026-06-20T08:45:00.000Z'
)
ON CONFLICT ("version") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "releasedAt" = EXCLUDED."releasedAt";
