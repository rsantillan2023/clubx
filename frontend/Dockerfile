# Stage 1: build con Node oficial (evita NodeSource/apt que fallan en Railway)
FROM node:18-alpine AS builder

# Sin NODE_ENV=production aquí: npm debe instalar devDependencies (@vue/cli-service)
# para que "npm run build" encuentre vue-cli-service.
WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . ./
ENV NODE_ENV=production
RUN npm run build

# Stage 2: servir con nginx (escucha en PORT que inyecta Railway)
FROM nginx:1.21-alpine

COPY --from=builder /app/dist /var/www/html/dist
COPY ./nginx/config/nginx.conf.template /etc/nginx/nginx.conf.template
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
CMD ["/docker-entrypoint.sh"]
