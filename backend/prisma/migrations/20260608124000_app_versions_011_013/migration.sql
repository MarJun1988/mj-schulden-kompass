INSERT INTO "AppVersion" (
  "id",
  "version",
  "title",
  "description",
  "notes",
  "releasedAt"
) VALUES
(
  '20260608071000-0.1.1',
  '0.1.1',
  'Production-Rollout vorbereitet',
  'Production-Compose und Server-Umgebung wurden fuer den ersten Rollout vorbereitet und auf externe Docker-Images ausgerichtet.',
  ARRAY[
    'Production-Compose fuer Docker-Hub-Images vorbereitet',
    'Mailpit aus Production entfernt',
    'Production-Env-Beispiel erweitert',
    'Serverbetrieb und Deploy-Variablen strukturiert'
  ]::TEXT[],
  '2026-06-08T07:10:00.000Z'
),
(
  '20260608080000-0.1.2',
  '0.1.2',
  'GitLab-CI und Image-Publishing',
  'Die GitLab-CI wurde fuer Build, Docker-Image-Publishing, Deploy und GitHub-Export vorbereitet.',
  ARRAY[
    'GitLab-CI fuer Build und Deploy vorbereitet',
    'Docker-Hub-Images fuer Backend, Frontend, Docs und Edge eingebunden',
    'GitHub-Export und Release-Verarbeitung vorbereitet',
    'Production-Compose nutzt versionierte Image-Tags'
  ]::TEXT[],
  '2026-06-08T08:00:00.000Z'
),
(
  '20260608085000-0.1.3',
  '0.1.3',
  'Rollout und Migrationen getestet',
  'Deploy, Healthchecks und Prisma-Migrationen wurden auf dem Zielsystem getestet und stabilisiert.',
  ARRAY[
    'Production-Deploy auf dem Zielsystem getestet',
    'Prisma-Migrationen fuer frische Server nachgezogen',
    'Compose-Startreihenfolge und Healthchecks stabilisiert',
    'Docker-Deploy-Ablauf fuer neue Versionen geprueft'
  ]::TEXT[],
  '2026-06-08T08:50:00.000Z'
)
ON CONFLICT ("version") DO NOTHING;
