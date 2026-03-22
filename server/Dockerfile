FROM node:20-bullseye-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
