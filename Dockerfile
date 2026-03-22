# Stage 1: build the React/Vite app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve the built files with a lightweight static server
FROM pierrezemb/gostatic
COPY --from=builder /app/dist /srv/http/
CMD ["-port","8080","-enable-logging"]
