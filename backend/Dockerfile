# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY . .

RUN npm install
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"] 