FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY docs/package.json docs/package.json
RUN npm ci

COPY backend backend
ENV DATABASE_URL="postgresql://mj_money:mj_money@localhost:5432/mj_money?schema=public"
RUN npm run prisma:generate -w backend
RUN npm run build -w backend

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/backend/prisma.config.ts backend/prisma.config.ts
COPY --from=build /app/node_modules node_modules

EXPOSE 4001

CMD ["node", "backend/dist/index.js"]
