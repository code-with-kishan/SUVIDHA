# SUVIDHA – Smart Urban Virtual Interactive Digital Helpdesk Assistant

Production-ready full-stack civic kiosk MVP with multilingual frontend, OTP authentication, service/complaint workflows, document upload, payment simulation, receipt generation, admin dashboard, and audit logs.

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

## Deployment Targets

- Frontend: Vercel / Netlify
- Backend: Render / Railway / AWS
- Database: Supabase / Neon / RDS

See `server/API.md` and `DEPLOYMENT.md` for details.
