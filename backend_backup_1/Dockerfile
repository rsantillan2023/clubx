# pull official base image
FROM node:16-alpine
# set working directory
WORKDIR /app
# install app dependencies
COPY package.json ./
RUN npm install
COPY . ./
RUN npm install typescript pm2 -g
RUN npm run build

# start app
EXPOSE 3015

CMD ["pm2-runtime", "start", "./dist/index.js"]