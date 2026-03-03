# SUVIDHA – Smart Urban Virtual Interactive Digital Helpdesk Assistant

Production-ready full-stack civic kiosk MVP with multilingual frontend, OTP authentication, service/complaint workflows, document upload, payment simulation, receipt generation, admin dashboard, audit logs, offline queue sync, kiosk idle privacy reset, and fraud-risk scoring hooks.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Redux Toolkit, i18next
- Backend: Node.js, Express, JWT, OTP (Twilio/mock), RBAC
- Database: SQLite (local dev) / PostgreSQL (production) + Prisma ORM
- Storage: Local upload storage (S3/Cloudinary ready via service abstraction)

## Folder Structure

- `client/` frontend app
- `server/` backend API + Prisma schema

## Quick Start

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

### Seed default admin (local)

```bash
cd server
npm run seed:admin
```

Default local admin credentials:
- Mobile: `9999999999`
- Password: `Admin@123`

### 2) Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Default Flows

- Citizen: language -> OTP login -> dashboard -> request/complaint/upload/payment -> status/receipt
- Admin: login -> dashboard -> manage requests/complaints/users -> reports

## API Base

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Security Included

- Helmet headers
- JWT auth
- Role-based access control
- OTP expiry (2 min)
- Rate limiting
- HMAC SHA256 signatures for payment payload
- Password hashing for admin login (`bcrypt`)
- Kiosk device authentication for heartbeat endpoint (`x-kiosk-id`, `x-kiosk-key`)
- Tamper-evident audit chain hashing (SHA-256 hash chain in audit metadata)
- Session token storage in `sessionStorage` for kiosk-safe non-persistent sessions

## Kiosk Runtime Features

- Full-screen kiosk trigger (`Kiosk Fullscreen` button)
- Auto privacy blur on inactivity (45s)
- Auto session reset countdown (10s) after idle blur
- `Start New User` hard reset action
- Offline/online banner with queued transaction count
- Offline queue sync for service request and complaint workflows
- Touch feedback animation + optional vibration (`navigator.vibrate`)
- High contrast mode and adjustable font scale controls

## AI / Monitoring Features

- Payment fraud risk scoring (`LOW | MEDIUM | HIGH`) at payment creation
- Fraud alert audit event (`PAYMENT_FRAUD_ALERT`) for high-risk transactions
- Admin health endpoint with kiosk online/offline summary
- Admin audit logs endpoint for real-time monitoring

## Deployment Artifacts Added

- Dockerfiles: `client/Dockerfile`, `server/Dockerfile`
- Local container orchestration: `docker-compose.yml`
- Kubernetes manifests: `k8s/server-deployment.yaml`, `k8s/client-deployment.yaml`, `k8s/ingress.yaml`, `k8s/hpa.yaml`

## Phase-2 Microservice Extraction

- `microservices/auth-service`: OTP, profile, admin login, JWT issuance
- `microservices/payment-fraud-service`: payment create/verify, fraud-risk scoring
- `microservices/notification-service`: SMS/email dispatch with provider abstraction and mock fallback
- `microservices/api-gateway`: contract routing layer
	- `/api/auth` → auth-service
	- `/api/payments` → payment-fraud-service
	- `/api/notifications` → notification-service
	- remaining `/api/*` domains → core monolith service
- Istio mTLS-ready policy: `k8s/mtls-istio.yaml`

## Deployment Targets

- Frontend: Vercel / Netlify
- Backend: Render / Railway / AWS
- Database: Supabase / Neon / RDS

See `server/API.md` and `DEPLOYMENT.md` for details.
