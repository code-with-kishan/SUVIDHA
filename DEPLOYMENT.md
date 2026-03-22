# SUVIDHA Deployment Guide

## Frontend (Vercel/Netlify)

- Root: `client`
- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Vercel routing: `client/vercel.json` provides SPA fallback to `index.html`
- Env:
  - `VITE_API_URL=https://your-api-domain`
  - `VITE_KIOSK_ID=kiosk-01`
  - `VITE_KIOSK_KEY=<device-key>`
  - `VITE_APP_VERSION=1.0.0`

## Backend (Render/Railway/AWS)

- Root: `server`
- Build: `npm install && npx prisma generate`
- Start: `npm start`
- Required env:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `HMAC_SECRET`
  - `CORS_ORIGIN`
  - `KIOSK_DEVICE_KEYS` (format: `kiosk-01:key1,kiosk-02:key2`)
  - optional Twilio/SMTP keys

Note:
- The current backend uses Prisma + local uploads and is not a good fit for a single Vercel serverless deployment in its current form.
- Recommended production pattern: deploy frontend on Vercel and backend on Render/Railway/AWS, then set `VITE_API_URL` to backend HTTPS URL.

## Database (Neon/Supabase/RDS)

- Local development default uses SQLite (`DATABASE_URL=file:./dev.db`).
- For production, set a PostgreSQL `DATABASE_URL` (Neon/Supabase/RDS).

- Create PostgreSQL database
- Set `DATABASE_URL` in backend env
- Run migration:

```bash
npx prisma migrate deploy
```

## Production Checklist

- Set strong secrets for JWT/HMAC
- Restrict CORS to frontend domain
- Enforce HTTPS at platform level
- Configure persistent object storage (S3/Cloudinary) for uploads
- Configure SMS and email providers
- Set monitoring and log retention

## Container Deployment

- Build and run locally:

```bash
docker compose up --build
```

- Client: `http://localhost:8080`
- API Gateway: `http://localhost:5000`
- Core service: `http://localhost:5003`
- Auth service: `http://localhost:5101`
- Payment-fraud service: `http://localhost:5102`

Gateway routing contracts:

- `/api/auth/*` → auth-service
- `/api/payments/*` → payment-fraud-service
- `/api/services|complaints|documents|admin|sync/*` → core service

## Kubernetes Deployment Baseline

Manifests are available in `k8s/`:

- `server-deployment.yaml` (API deployment + service)
- `auth-service-deployment.yaml`
- `payment-fraud-service-deployment.yaml`
- `notification-service-deployment.yaml`
- `api-gateway-deployment.yaml`
- `client-deployment.yaml` (frontend deployment + service)
- `ingress.yaml` (TLS ingress and path routing)
- `hpa.yaml` (horizontal autoscaling)
- `mtls-istio.yaml` (service-to-service STRICT mTLS policy)

Apply in sequence:

```bash
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/payment-fraud-service-deployment.yaml
kubectl apply -f k8s/notification-service-deployment.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/mtls-istio.yaml
```
