# SUVIDHA – Smart Urban Virtual Interactive Digital Helpdesk Assistant

SUVIDHA is a civic-service kiosk platform for citizen service requests, complaints, payments, document upload, and status tracking with multilingual + accessibility-first UX.

It includes:
- Citizen and Admin flows
- OTP-based citizen login and admin MFA login
- Voice guidance + voice field-fill assistance
- Offline-ready queue sync for core workflows
- Fraud scoring for payments
- Admin monitoring and operational tools

---

## 1) Project Overview

SUVIDHA is designed for kiosk and assisted-service environments where users need a guided, touch-friendly workflow.

### Core citizen capabilities
- Service request submission
- Complaint registration
- Document upload
- Payment simulation and receipt generation
- Status tracking by 4-digit reference ID

### Core admin capabilities
- Admin MFA login (password + OTP)
- Requests and complaints management
- View user-submitted documents in context
- Update status (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`)
- Close & permanently delete resolved/rejected items
- Dashboard, audit logs, and system health

---

## 2) Tech Stack

- Frontend: React (Vite), Tailwind CSS, Redux Toolkit, i18next
- Backend: Node.js, Express, Prisma, JWT, RBAC
- Database (local dev): SQLite
- OTP channels: Email + SMS abstraction (provider or mock)
- Storage: Local uploads (`/uploads`) with service abstraction
- Infra: Docker, Docker Compose, Kubernetes manifests, Istio mTLS policy

---

## 3) Repository Structure

- `client/` – React frontend
- `server/` – Main API + Prisma schema
- `microservices/` – Phase-2 extracted services (`auth-service`, `payment-fraud-service`, `notification-service`, `api-gateway`)
- `k8s/` – Kubernetes deployment manifests
- `DEPLOYMENT.md` – deployment guidance
- `server/API.md` – API endpoint reference

---

## 4) Local Setup (Recommended)

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Backend setup

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed:admin
```

### Frontend setup

```bash
cd client
npm install
cp .env.example .env
```

---

## 5) Run Commands

### Option A: Two terminals (easiest for debugging)

Terminal 1 (backend):
```bash
cd server && PORT=5003 CORS_ORIGIN='http://localhost:5173,http://localhost:8080' npm run dev
```

Terminal 2 (frontend):
```bash
cd client && npm run dev -- --host 0.0.0.0 --port 5173
```

### Option B: Single-line command from repository root

```bash
(cd server && PORT=5003 CORS_ORIGIN='http://localhost:5173,http://localhost:8080' npm run dev >/tmp/suvidha-server.log 2>&1 &) && cd client && npm run dev -- --host 0.0.0.0 --port 5173
```

### Local URLs
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5003/api/health`

---

## 6) Default Admin Credentials (Local Dev)

After `npm run seed:admin`:
- Mobile: `9999999999`
- Password: `Admin@123`

Note: Admin login is MFA. After password login, OTP verification is required.

---

## 7) Key Application Flows

### Citizen flow
1. Select language
2. OTP login
3. Use dashboard modules:
	 - Service request
	 - Complaint
	 - Upload documents
	 - Payment
	 - Status tracking
4. Track with generated 4-digit reference code

### Admin flow
1. Login with mobile + password
2. Verify OTP challenge
3. Manage requests/complaints
4. Optionally close and delete completed/rejected cases

---

## 8) Important Features

### Privacy and tracking
- 4-digit unique reference IDs for service requests and complaints
- Status lookup supports reference code (preferred) and legacy numeric IDs

### Admin operations
- Request/complaint cards show:
	- category/type
	- description text
	- user documents (clickable)
- `Close & Delete` action is available only for `RESOLVED`/`REJECTED`

### Accessibility and kiosk UX
- Audio guidance and repeat prompts
- Voice command and voice-fill on selected forms
- Toggle keyboard/keypad support
- High contrast and font scaling
- Idle privacy reset and quick `Start New User`

### Reliability
- Offline queue + sync for key citizen actions
- API audit logging and health endpoints

---

## 9) Security Notes

- Helmet security headers
- JWT auth for protected routes
- Role-based access control (`CITIZEN`, `ADMIN`, `SUPER_ADMIN`)
- OTP expiry and rate limiting
- Password hashing with `bcrypt`
- Kiosk heartbeat device-auth headers (`x-kiosk-id`, `x-kiosk-key`)

---

## 10) API Highlights

Detailed API docs: `server/API.md`

Important endpoints:
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/admin/login`
- `POST /api/admin/login/verify`
- `POST /api/services/request`
- `POST /api/complaints`
- `GET /api/services/application-status/:id`
- `DELETE /api/admin/close/:id`

---

## 11) Deployment Assets

- Docker: `client/Dockerfile`, `server/Dockerfile`
- Compose: `docker-compose.yml`
- Kubernetes manifests in `k8s/`
- Additional architecture docs:
	- `DEPLOYMENT.md`
	- `SUVIDHA_ARCHITECTURE.md`
	- `MICROSERVICES_PHASE2.md`

---

## 12) Troubleshooting

### Port already in use
```bash
lsof -nP -iTCP:5003 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

### Prisma mismatch errors
```bash
cd server
npx prisma generate
npx prisma db push
```
Then restart backend.

### Document link opens wrong port
- Ensure backend runs on `5003`
- New uploads use request host dynamically
- Legacy links are rewritten on admin pages

### Admin login fails after DB reset
```bash
cd server
npm run seed:admin
```

---

## 13) Current Development Status

This repository currently contains both:
- Main monolith (`server`) used for active local flow
- Phase-2 extracted microservice code under `microservices/`

Use monolith paths for quickest local MVP run unless you are explicitly testing gateway/microservice deployment.
