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

Orders:
- `POST /v1/orders`
- `GET /v1/orders/:orderId`

Payments:
- `POST /v1/orders/:orderId/payments`
- `GET /v1/payments/:paymentId`
- `POST /v1/payments/:paymentId/check`
- `POST /v1/payments/:paymentId/cancel`

Webhook:
- `POST /v1/webhooks/autogopay`

## Database

Current database-backed development flow includes:
- outlet
- category
- product
- modifier group/option
- order/order item
- payment

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

Latest validated implementation head: `035379c16378d599cde8d8d626bae8106ff3b984`.

## Security

- payment-provider key stays server-side
- webhook signature is verified from raw request body
- client-supplied totals are not trusted
- payment amount is checked against local order
- signing/database/provider secrets are not committed

Read:
- `../../docs/integrations/PAYMENTS.md`
- `../../docs/integrations/AUTOGOPAY.md`
- `../../SECURITY.md`
