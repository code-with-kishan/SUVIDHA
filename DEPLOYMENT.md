# SUVIDHA Deployment Guide

## Frontend (Vercel/Netlify)

- Root: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_URL=https://your-api-domain`

## Backend (Render/Railway/AWS)

- Root: `server`
- Build: `npm install && npx prisma generate`
- Start: `npm start`
- Required env:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `HMAC_SECRET`
  - `CORS_ORIGIN`
  - optional Twilio/SMTP keys

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
