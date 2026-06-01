# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Même origine que l'API Gateway : les appels partent vers /api/* (proxifiés par Nginx).
ARG VITE_AUTH_URL=""
ARG VITE_TONTINE_URL=""
ARG VITE_NOTIFY_URL=""
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_TONTINE_URL=$VITE_TONTINE_URL
ENV VITE_NOTIFY_URL=$VITE_NOTIFY_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Runtime stage (Nginx statique) ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
