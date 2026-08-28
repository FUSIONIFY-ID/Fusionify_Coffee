# Architecture

## Current Runtime Path

```text
Flutter Customer App
  |
  | Dio + Riverpod
  v
NestJS API
  |
  +-- Catalog / Orders / Payments
  |
  v
Prisma 7 + @prisma/adapter-pg
  |
  v
PostgreSQL

Payments:
NestJS
  |
  v
Payment Provider Adapter
  |
  +-- AutoGoPay
        |
        +-- GoPay QRIS       [enabled]
        +-- ShopeePay QRIS   [modeled, not enabled]
        +-- Interactive QRIS [modeled, not enabled]
```

## Customer Architecture

Feature-oriented Flutter structure:

```text
lib/
  app/
  core/
    network/
    utils/
  features/
    catalog/
    home/
    menu/
    product/
    cart/
    checkout/
    payment/
    orders/
    rewards/
    account/
```

Rules:
- presentation does not own provider credentials
- local UI totals are not checkout authority
- network errors do not silently fall back to fake runtime data
- tests may use fixtures/provider overrides

## Catalog Path

```text
Flutter Screen
 -> Riverpod
 -> CatalogRepository
 -> Dio
 -> GET /v1/catalog/preview
 -> CatalogService
 -> PrismaService
 -> PostgreSQL
```

## Checkout Path

```text
Cart
 -> POST /v1/orders
 -> OrdersService
 -> reload active products/modifiers
 -> validate selections
 -> calculate prices
 -> persist Order + snapshot OrderItems
```

Client sends identifiers and quantities only.

## Payment Creation Path

```text
Checkout
 -> POST /v1/orders/:orderId/payments
 -> reserve local Payment
 -> AutoGoPay GoPay adapter
 -> /qris/generate
 -> validate provider amount
 -> persist transaction/QR/expiry
 -> return safe Payment view
 -> Flutter renders qrString
```

A database constraint prevents more than one local PENDING payment per order.

## Payment Detection

Automatic user-facing loop:

```text
AutoGoPay webhook
 -> raw-body HMAC verification
 -> payment lookup + amount check
 -> normalized state
 -> Payment PAID
 -> Order CONFIRMED

Flutter payment screen
 -> GET local Fusionify Payment every ~3 sec
 -> sees webhook-updated state
```

Flutter does not poll AutoGoPay every three seconds.

Manual fallback:

```text
Check Status
 -> Fusionify API
 -> AutoGoPay /qris/status
 -> normalize/persist
 -> return local state
```

App resume also performs provider reconciliation while a payment remains pending.

## Payment Security Boundary

- AutoGoPay key server-side only
- production callback uses HTTPS
- webhook signature checked against raw body
- HMAC-SHA256
- constant-time comparison
- provider amount checked against local payment
- client cannot assert payment completion
- client cannot assert final order amount
- provider raw status stored separately
- checkout/payment idempotency keys are local Fusionify controls

## Provider Create Ambiguity

The reviewed GoPay create contract does not show a caller-supplied external idempotency key.

Therefore a timeout after provider acceptance but before response receipt can be ambiguous.

Do not blindly auto-retry provider QR creation until a safe reconciliation strategy is validated.

## Order and Payment States

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

Payment and fulfillment state remain separate.

## Realtime

Current payment UI polls local Fusionify state.

Future realtime/socket/push updates are an optimization and must not replace authoritative GET/reconciliation APIs.

## Operations / Future Modules

Create modules only when implementation begins:
- authentication/users
- POS/KDS
- rewards
- vouchers
- inventory/procurement/assets
- delivery/maps
- digital benefits

## Architectural Change

Durable architecture changes require an ADR under `docs/adr/`.
