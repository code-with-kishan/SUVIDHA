# SUVIDHA Target Architecture (Phase Roadmap)

## Current Implementation (This Repository)

This codebase currently runs as a modular monolith (React + Express + Prisma) with these implemented capabilities:

- JWT + RBAC auth
- OTP login
- Rate limiting + secure headers
- Offline queue sync API (`/api/sync/queue`)
- Kiosk heartbeat device auth (`/api/health/kiosk-heartbeat`)
- Fraud-risk scoring in payment flow
- Tamper-evident audit hash chain metadata
- Admin health + audit monitoring endpoints

## Target Microservices Architecture

Citizen User → HTTPS/TLS 1.3 → API Gateway/WAF → Load Balancer → Microservices (mTLS) → Encrypted Databases & Secure Object Storage

### Planned Services

1. Authentication Service (OIDC/OAuth2/MFA)
2. Citizen Profile Service
3. Service Management API
4. Complaint & Workflow Service
5. Payment Service
6. Notification Service (SMS/Email)
7. Admin Dashboard Service
8. Audit Logging Service
9. AI Fraud Detection Service
10. Offline Sync Service

## Security Model (Zero Trust)

- Identity verification on every protected request
- JWT validation and role enforcement
- Device authentication for kiosk heartbeats
- Encryption in transit (TLS)
- Strong secret management via K8s Secrets / cloud vault
- Tamper-evident audit trail hashes

## Offline Strategy

- Local queue in browser storage
- User actions queued when network is unavailable
- Sync to backend queue endpoint on reconnect
- Sync response includes per-item success/failure status

## High Availability Baseline

- Stateless API pods with horizontal autoscaling
- Health and readiness probes
- Ingress TLS routing
- Multi-replica frontend and backend deployments

## Hybrid Cloud Pattern

- Cloud: Kubernetes + managed DB + object storage + WAF
- On-prem: secure gateway node for sensitive integrations
- Data and event exchange via secure private link / VPN

## STRIDE Coverage (Implemented + Roadmap)

- Spoofing: OTP/JWT/device key validation
- Tampering: HMAC signatures + audit hash chain
- Repudiation: immutable-style audit metadata with hash linkage
- Information Disclosure: HTTPS, secure headers, role guards
- Denial of Service: API and OTP rate limiting
- Elevation of Privilege: RBAC middleware and protected routes

## Next Step for Full Scale-Out

Extract service boundaries one-by-one behind an API gateway:

1. Payment + Fraud ✅ (phase-2 extracted service added)
2. Auth/Profile ✅ (phase-2 extracted service added)
3. Sync + Notification ⏳
4. Admin + Audit ⏳

Each extracted service should use mTLS service identity and separate storage schemas.

## Phase-2 Delivered (Current)

- `microservices/auth-service`
- `microservices/payment-fraud-service`
- `microservices/api-gateway`
- Kubernetes manifests for service deployments and HPAs
- Istio STRICT mTLS readiness manifest (`k8s/mtls-istio.yaml`)
