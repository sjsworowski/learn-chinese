# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed first to improve caching
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY . .

RUN npm install
RUN npm run build

# Expose your app port
EXPOSE 8080

# 🔥 Run migration before starting the app
CMD ["sh", "-c", "node run-migration.js && npm run start:prod"]