# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Recibir variable de build (URL del backend — Vite la embebe en el bundle)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar codigo fuente
COPY . .

# Compilar el proyecto Vite
RUN npm run build

# Stage 2: Runtime (sirve solo los archivos dist)
FROM pierrezemb/gostatic

# Copiar archivos compilados desde stage anterior
COPY --from=builder /app/dist /srv/http/

# Configurar puerto, SPA fallback y logging
CMD ["-port","8080","-https-promote","-fallback","index.html","-enable-logging"]
