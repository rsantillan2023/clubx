# Stage 1: build con Node oficial (evita NodeSource/apt que fallan en Railway)
FROM node:18-alpine AS builder

# Build-time: Railway puede pasar estas variables como build args para que queden en el bundle.
ARG VUE_APP_ENVIROMENT=production
ARG VUE_APP_DEGIRA
ARG VUE_APP_LOGIN_URI
ARG VUE_APP_PARTNERS
ARG VUE_APP_REGISTER
ARG VUE_APP_PARTNERS_UPDATE
ARG VUE_APP_CREATE_BRAZALETE
ARG VUE_APP_VISITS
ARG VUE_APP_ENTRY_REGISTER
ARG VUE_APP_EXIT_REGISTER
ARG VUE_APP_BUTTONS

ENV VUE_APP_ENVIROMENT=$VUE_APP_ENVIROMENT
ENV VUE_APP_DEGIRA=$VUE_APP_DEGIRA
ENV VUE_APP_LOGIN_URI=$VUE_APP_LOGIN_URI
ENV VUE_APP_PARTNERS=$VUE_APP_PARTNERS
ENV VUE_APP_REGISTER=$VUE_APP_REGISTER
ENV VUE_APP_PARTNERS_UPDATE=$VUE_APP_PARTNERS_UPDATE
ENV VUE_APP_CREATE_BRAZALETE=$VUE_APP_CREATE_BRAZALETE
ENV VUE_APP_VISITS=$VUE_APP_VISITS
ENV VUE_APP_ENTRY_REGISTER=$VUE_APP_ENTRY_REGISTER
ENV VUE_APP_EXIT_REGISTER=$VUE_APP_EXIT_REGISTER
ENV VUE_APP_BUTTONS=$VUE_APP_BUTTONS

# Sin NODE_ENV=production aquí: npm debe instalar devDependencies (@vue/cli-service)
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
