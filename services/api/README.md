# Fusionify Coffee API

NestJS backend for Fusionify Coffee.

## Stack

- Node.js 24 LTS
- NestJS 11
- TypeScript
- PostgreSQL
- Prisma 7
- `@prisma/adapter-pg`

## Implemented APIs

Catalog:
- `GET /v1/health`
- `GET /v1/catalog/preview`

Customer auth/account:
- `POST /v1/auth/otp/request`
- `POST /v1/auth/otp/verify`
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/reset-password`
- authenticated profile/session/change-phone/delete-account endpoints

Orders:
- `POST /v1/orders`
- `GET /v1/orders`
- `GET /v1/orders/:orderId`

Payments:
- `POST /v1/orders/:orderId/payments`
- `GET /v1/payments/:paymentId`
- `POST /v1/payments/:paymentId/check`
- `POST /v1/payments/:paymentId/cancel`

Rewards and membership:
- `GET /v1/rewards/me`
- staff-configurable Fusion Points earning programs
- staff-configurable membership tiers per currency
- membership qualification from completed customer spend
- optional tier points multipliers
- membership implementation is currently undergoing full CI validation

Webhook:
- `POST /v1/webhooks/autogopay`

Staff/admin:
- `POST /v1/staff/auth/login`
- `POST /v1/staff/auth/totp/setup`
- `POST /v1/staff/auth/totp/verify`
- `POST /v1/staff/auth/refresh`
- `GET /v1/staff/me`
- `POST /v1/staff/auth/logout`
- `GET /v1/staff/audit-logs` (permission protected)

Initial SUPER_ADMIN creation is server-side only through:

```bash
npm run staff:bootstrap
```

Staff authentication is separate from customer authentication and requires password + TOTP.

## Database

Current database-backed development flow includes:
- outlet
- category
- product
- modifier group/option
- order/order item
- payment
- Fusion Points ledger/account/program
- membership tier/progress

Run:

```bash
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
npm run start:dev
```

Environment template:

```text
DATABASE_URL=...
AUTOGOPAY_API_KEY=
AUTOGOPAY_BASE_URL=https://v1-gateway.autogopay.site
```

Never commit real credentials.

## Checkout Authority

Mobile prices are presentation only.

The API reloads products/modifiers from PostgreSQL and calculates the authoritative order amount before payment creation.

Both order and payment creation require `Idempotency-Key`.

## AutoGoPay

Current runtime adapter enables:
- provider: `AUTOGOPAY`
- channel: `GOPAY_QRIS`

Implemented:
- generate
- status
- cancel pending
- raw-body webhook HMAC
- local state normalization

Not yet live-validated.

## Validation

CI runs:

```bash
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
npm run lint
npm test -- --runInBand
npm run test:e2e
npm run build
```

CI uses PostgreSQL 17.

Latest previously validated implementation head: `a139346b5dab4d5cb53bfa8b6eb5c02356cefd56`.
The current voucher/rewards/inventory head is being revalidated after repo-wide API formatting with the repository's Prettier version.

## Security

- payment-provider key stays server-side
- webhook signature is verified from raw request body
- client-supplied totals are not trusted
- payment amount is checked against local order
- signing/database/provider secrets are not committed
- customer and staff identity/session silos are separate
- staff TOTP secrets are encrypted with AES-256-GCM
- staff privileged endpoints use explicit RBAC permissions
- staff auth/security activity has an audit-log foundation

Read:
- `../../docs/integrations/PAYMENTS.md`
- `../../docs/integrations/AUTOGOPAY.md`
- `../../SECURITY.md`
