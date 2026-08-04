# syntax=docker/dockerfile:1

# ============================================================================
# Painel do PROFESSOR (control plane, Vite + React). Multi-stage:
#   Stage 1 (build):   compila o SPA para arquivos estáticos (dist/).
#   Stage 2 (runtime): Nginx serve o SPA e faz proxy de /api -> backend
#                      (o mesmo papel do proxy do Vite em desenvolvimento).
# O destino do proxy é a env BACKEND_URL (definida no EasyPanel).
# ============================================================================

# ---------- Stage 1: build ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

# BACKEND_URL: URL interna do serviço do backend no EasyPanel.
ENV BACKEND_URL=http://backend:3333
# Substitui APENAS ${BACKEND_URL} no template (preserva $host, $uri do nginx).
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
