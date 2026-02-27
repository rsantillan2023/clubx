# Stage 1: build con Node oficial (evita NodeSource/apt que fallan en Railway)
FROM node:18-alpine AS builder

ARG ENVIROMENT=production
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . ./
RUN npm run build

# Stage 2: servir con nginx
FROM nginx:1.21-alpine

COPY --from=builder /app/dist /var/www/html/dist
COPY ./nginx/config/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
