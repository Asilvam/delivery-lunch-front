# Stage 1: Build
FROM node:24.22.2-alpine AS builder
WORKDIR /app

# Recibir variable de build (URL del backend — Vite la embebe en el bundle)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar codigo fuente
COPY . .

# Compilar el proyecto Vite
RUN npm run build

# Stage 2: Runtime
FROM node:24.22.2-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 8080
CMD ["npm", "start"]
