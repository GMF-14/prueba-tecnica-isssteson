# ===== Etapa de compilación =====
FROM node:24-alpine AS build
WORKDIR /app

# Se copia el workspace completo (pnpm-lock.yaml vive en la raíz del monorepo)
# para que pnpm pueda resolver las dependencias igual que en desarrollo.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json frontend/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY frontend ./frontend

# No se "hornea" una URL fija: Nginx hace de reverse proxy hacia el backend,
# así que el frontend siempre llama a la ruta relativa /api.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter frontend build

# ===== Etapa de ejecución =====
FROM nginx:alpine AS final
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
