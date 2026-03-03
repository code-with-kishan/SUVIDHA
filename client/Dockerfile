FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=http://localhost:5000
ARG VITE_KIOSK_ID=kiosk-01
ARG VITE_KIOSK_KEY=change-me
ARG VITE_APP_VERSION=1.0.0
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KIOSK_ID=$VITE_KIOSK_ID
ENV VITE_KIOSK_KEY=$VITE_KIOSK_KEY
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
