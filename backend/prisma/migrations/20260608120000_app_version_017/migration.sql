INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES (
  '20260608120000-0.1.7',
  '0.1.7',
  'Erinnerungsmails fuer offene Schulden',
  'Offene Schulden koennen jetzt manuell per Erinnerungsmail angemahnt werden. Das Frontend meldet Erfolg und Fehler per Toast.',
  ARRAY[
    'Erinnerungsmail per Knopfdruck fuer offene Schulden',
    'Backend prueft Besitzer und Zahlungsstatus vor dem Versand',
    'SMTP-Fehler werden an das Frontend zurueckgemeldet',
    'PrimeVue Toasts fuer Erfolg und Fehler beim Erinnern'
  ]::TEXT[],
  '2026-06-08T12:00:00.000Z'
);
