FROM node:20-bookworm-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
