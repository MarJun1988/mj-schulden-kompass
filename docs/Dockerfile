FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY docs/package.json docs/package.json
RUN npm ci

COPY docs docs
ENV VITEPRESS_BASE=/docs/
RUN npm run build:docs

FROM nginx:1.27-alpine

COPY docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/docs/.vitepress/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
