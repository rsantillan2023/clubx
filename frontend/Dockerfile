FROM nginx:1.21.0

ARG ENVIROMENT=production

RUN echo "Configurando $ENVIROMENT"

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -

RUN apt-get install -y nodejs

WORKDIR /var/www/html

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . ./

RUN npm run build

COPY ./nginx/config/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80