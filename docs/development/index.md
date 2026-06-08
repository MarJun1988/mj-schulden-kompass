# Entwicklung

## Wichtige Skripte

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run dev:docs
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run build:docs
```

## Struktur

```text
backend/   GraphQL API, Prisma, JWT, Mailversand
frontend/  Vue App mit PrimeVue, Pinia und Router
docs/      VitePress Dokumentation
docker/    Nginx und Edge-Routing fuer Production
```

![Architektur](/images/architecture.svg)

## Codequalitaet

SchuldKompass nutzt OXC-Tools:

- `oxlint` fuer schnelles Linting
- `oxfmt` fuer Formatierung

```bash
npm run lint
npm run format:check
```

## Datenbank

Postgres laeuft per Docker Compose auf `localhost:5433`.

```bash
docker compose up -d postgres
npm run prisma:generate
```

Prisma 7 nutzt `backend/prisma.config.ts` fuer die Datenbank-URL.

## Production

Der Production-Stack baut eigene Container fuer Frontend, Backend, Docs und die Nginx-Schicht.

```bash
npm run docker:prod:build
npm run docker:prod:up:local
```
