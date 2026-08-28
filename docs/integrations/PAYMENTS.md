# Payments

## Architecture Rule

Provider credentials stay server-side.

```text
Flutter
  |
  | product/modifier IDs + quantity
  v
Fusionify Coffee API
  |
  | server-authoritative order pricing
  v
Order + Payment
  |
  v
Payment Provider Adapter
  |
  +-- AutoGoPay / GoPay QRIS
  +-- future channels/providers
```

Flutter never calls AutoGoPay directly.

## Implemented Domain States

Payment:
- PENDING
- PAID
- EXPIRED
- CANCELLED
- FAILED
- REFUNDED

Order:
- AWAITING_PAYMENT
- CONFIRMED
- PREPARING
- READY
- PICKED_UP
- COMPLETED
- CANCELLED

Payment state and order state are separate.

## Server-Authoritative Checkout

`POST /v1/orders`

Required header:

```http
Idempotency-Key: <stable checkout operation key>
```

Client sends:
- outlet ID
- product IDs
- modifier option IDs
- quantities

Client does not submit an authoritative final amount.

Backend:
1. validates pickup outlet
2. reloads active products/modifiers from PostgreSQL
3. validates required/single-select modifier rules
4. rejects unknown/duplicate modifiers
5. recalculates unit/line/subtotal
6. snapshots product/modifier names and prices
7. persists an AWAITING_PAYMENT order

Repeating the same checkout key returns the same order.

## Create Payment

`POST /v1/orders/:orderId/payments`

Required header:

```http
Idempotency-Key: <stable payment operation key>
```

Current body:

```json
{
  "channel": "GOPAY_QRIS"
}
```

Current behavior:
- only GoPay QRIS enabled
- order must be AWAITING_PAYMENT
- paid orders cannot create another payment
- existing active pending payment is reused
- database enforces one PENDING payment per order
- payment reservation is persisted before calling the external provider
- provider failure does not confirm the order

## Payment Views

Local authoritative payment:

```http
GET /v1/payments/:paymentId
```

Provider reconciliation:

```http
POST /v1/payments/:paymentId/check
```

Pending cancellation:

```http
POST /v1/payments/:paymentId/cancel
```

The Flutter automatic status loop uses the local GET endpoint, not the provider reconciliation endpoint.

This avoids repeatedly polling AutoGoPay from every device.

## Flutter Payment Behavior

Payment screen:
- renders `qrString` natively
- displays server/provider amount
- displays expiry/countdown when available
- polls Fusionify local payment state about every 3 seconds
- uses Check Status for explicit provider reconciliation
- uses Cancel only while local status is PENDING
- re-checks provider when app resumes with a pending payment
- clears cart only after PAID

## Webhook

```http
POST /v1/webhooks/autogopay
```

Current GoPay implementation:
- captures Nest raw body
- verifies `X-Signature`
- HMAC-SHA256 with server-side AutoGoPay API key
- constant-time comparison
- only processes the initial `QRIS` payment method
- checks amount against local payment
- ignores unknown provider transactions safely
- normalizes provider status
- updates payment
- transactionally moves AWAITING_PAYMENT order to CONFIRMED when PAID

## Idempotency / Concurrency

Fusionify protects:
- checkout operation key uniqueness
- payment operation key uniqueness
- provider transaction ID uniqueness
- one PENDING payment per order

Duplicate webhook/status signals must not create duplicate orders/payments.

## Cancellation vs Refund

Pending QRIS cancellation is not a refund.

Current automated cancel applies only to PENDING GoPay QRIS.

No automated refund contract is implemented.

## Known Create-Ambiguity Risk

The reviewed AutoGoPay GoPay create endpoint does not document a caller-provided idempotency key.

If the request reaches AutoGoPay but the response is lost, Fusionify may not receive the provider transaction ID.

Do not implement blind automatic create retries around this ambiguity.

Production validation should determine whether AutoGoPay offers an additional reconciliation/idempotency mechanism not shown in the reviewed docs.

## Test Boundary

Automated tests validate:
- order pricing/idempotency
- invalid modifiers
- database migrations
- safe unconfigured-provider behavior
- mocked QR creation normalization
- raw-body HMAC verification
- Flutter models/compile/analyze

Live AutoGoPay behavior remains unverified until a real secured environment is used.
