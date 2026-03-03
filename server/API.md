# SUVIDHA API Documentation

## Auth

- `POST /api/auth/send-otp`
  - body: `{ mobile, email? }`
  - response includes `channels` and in non-production also `devOtp`
- `POST /api/auth/verify-otp`
  - body: `{ mobile, otp, name?, email?, aadhaar? }`
- `GET /api/auth/profile`
  - auth: Bearer JWT

## Services

- `GET /api/services`
- `POST /api/services/request`
  - body: `{ serviceType, description }`
- `GET /api/services/status/:id`

## Complaints

- `POST /api/complaints`
  - body: `{ category, description }`
- `GET /api/complaints/user`

## Documents

- `POST /api/documents/upload`
  - multipart fields: `file`, `docType`, `consent=true`
- `GET /api/documents/user`

## Payments

- `POST /api/payments/create`
  - body: `{ amount, serviceType }`
  - response includes `risk: { riskScore, riskLevel, reasons[] }`
- `POST /api/payments/verify`
  - body: `{ paymentId, status }` where status in `SUCCESS | FAILED`

## Admin

- `POST /api/admin/login`
  - body: `{ mobile, password }`
- `GET /api/admin/dashboard`
- `GET /api/admin/health`
- `GET /api/admin/audit-logs?limit=50`
- `PUT /api/admin/update-status/:id`
  - body: `{ type: 'service'|'complaint', status }`
- `GET /api/admin/requests`
- `GET /api/admin/complaints`
- `GET /api/admin/users`

## Sync / Offline

- `POST /api/sync/queue`
  - auth required
  - body: `{ queue: [{ type, payload, clientQueueId, queuedAt }] }`
  - supported `type` values:
    - `SERVICE_REQUEST_CREATE`
    - `COMPLAINT_CREATE`

## Health / Kiosk Device

- `GET /api/health`
- `POST /api/health/kiosk-heartbeat`
  - headers: `x-kiosk-id`, `x-kiosk-key`
  - body: `{ appVersion, online, health }`

## Notes

- Use `Authorization: Bearer <token>` for protected routes.
- Citizen role: own records only.
- Admin/Super Admin role: management endpoints.
- Configure `KIOSK_DEVICE_KEYS` env for device authentication.
