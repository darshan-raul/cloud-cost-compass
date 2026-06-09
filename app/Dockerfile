FROM node:20-alpine AS builder
WORKDIR /build

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
ARG VITE_KEYCLOAK_URL=http://keycloak:8080
ARG VITE_KEYCLOAK_REALM=cloud-compass
ARG VITE_KEYCLOAK_CLIENT_ID=cloud-compass-app
ARG VITE_API_BASE=/api
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
