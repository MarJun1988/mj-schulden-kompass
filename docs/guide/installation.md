# Installation

## Voraussetzungen

- Node.js 22
- npm
- Docker mit Docker Compose

Im Projekt liegt eine `.nvmrc`:

```bash
nvm use
```

## Setup

```bash
npm install
cp backend/.env.example backend/.env
docker compose up -d
npm run prisma:generate
npm run dev
```

![Login und Registrierung](/images/login-register.svg)

## URLs

- App: `http://localhost:5173`
- GraphQL API: `http://localhost:4001`
- Backend-Metriken: `http://localhost:9101/metrics`
- Mailpit: `http://localhost:8025`
- Postgres: `localhost:5433`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Wenn `5173` schon belegt ist, nimmt Vite automatisch den naechsten freien Port.

## Dokumentation starten

```bash
npm run dev:docs
```

Die VitePress-Doku laeuft dann lokal, normalerweise auf `http://localhost:5173` oder dem naechsten freien Port.
