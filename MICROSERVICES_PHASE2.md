# SUVIDHA Phase-2 Service Contracts

## Topology

Client → API Gateway (`:5000`) → Domain Services

- Auth Service (`:5101`)
- Payment-Fraud Service (`:5102`)
- Core Service (`:5003`, existing monolith for remaining domains)

## Gateway Route Contracts

- `/api/auth/*` → `auth-service` (`/auth/*`)
- `/api/payments/*` → `payment-fraud-service` (`/payments/*`)
- `/api/admin/*` → `core-service`
- `/api/services/*` → `core-service`
- `/api/complaints/*` → `core-service`
- `/api/documents/*` → `core-service`
- `/api/sync/*` → `core-service`
- `/uploads/*` → `core-service`

## Auth Service API

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `GET /auth/profile` (Bearer token)
- `POST /auth/admin/login`

## Payment-Fraud Service API

- `POST /payments/create` (Bearer token)
- `POST /payments/verify` (Bearer token)

`POST /payments/create` returns:

```json
{
  "payment": { "id": 101, "transactionId": "TXN-..." },
  "risk": {
    "riskScore": 55,
    "riskLevel": "MEDIUM",
    "reasons": ["Moderate-high transaction amount"]
  }
}
```

## Security Notes

- JWT verification at service boundary
- Rate-limiting and secure headers enabled per service
- Tamper-evident audit chain in auth and payment-fraud services
- mTLS-ready mesh policy in `k8s/mtls-istio.yaml`

## Run Phase-2 Locally

```bash
docker compose up --build
```

Use API base: `http://localhost:5000`
