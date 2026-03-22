# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

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

# Configurar puerto y opciones
CMD ["-port","8080","-https-promote","-enable-logging"]
