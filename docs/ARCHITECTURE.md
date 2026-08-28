# Architecture

## High-Level Architecture

```text
Customer App (Flutter)
        |
        | Dio / Riverpod async state
        v
Fusionify Coffee API (NestJS)
        |
        +---- PostgreSQL / Prisma 7
        |
        +---- Payment Provider Adapter
        |         |
        |         +---- AutoGoPay
        |         |       |
        |         |       +---- GoPay QRIS
        |         |       +---- ShopeePay QRIS
        |         |       +---- QRIS Interactive
        |         |
        |         +---- Future providers
        |
        +---- Maps / Routing Adapter
        |
        +---- Notification Service
        |
        +---- Realtime / Event Delivery
        |
        +---- Future Digital Benefits
```

Operations applications such as Admin, POS, and KDS will consume the same backend domain model with role-appropriate APIs.

## Repository Direction

```text
apps/
  customer/
  admin/       # create when implementation begins
  pos/         # create when implementation begins
  kds/         # create when implementation begins

services/
  api/

docs/
```

Do not create empty application shells merely to suggest progress.

## Customer App

Use feature-based organization rather than a global dumping-ground structure.

Current direction:

```text
lib/
  app/
  core/
    network/
  features/
    auth/
    home/
    menu/
    product/
    cart/
    payment/
    orders/
    rewards/
    account/
    catalog/
```

Business logic should not live inside large presentation widgets.

## Customer Data Boundary

Catalog runtime flow:

```text
Screen
  |
  v
Riverpod FutureProvider
  |
  v
CatalogRepository
  |
  v
Dio
  |
  v
GET /v1/catalog/preview
  |
  v
NestJS CatalogService
  |
  v
PrismaService
  |
  v
PostgreSQL
```

Rules:
- UI does not silently fall back to fake local data on network failure.
- Loading, error, retry, and refresh states are explicit.
- Tests may override providers with test fixtures.
- API base URL is configuration.
- Production API uses HTTPS.
- Development HTTP allowance is isolated to platform development configuration.

## Persistence

Current catalog persistence is implemented and validated:
- Prisma 7
- `@prisma/adapter-pg`
- PostgreSQL
- initial migration
- development seed
- database-backed catalog query
- CI against PostgreSQL 17

The current seeded records are development fixtures, not production menu data.

## Backend Modules

Current/near-term direction:

```text
src/
  database/
  catalog/
  auth/
  users/
  outlets/
  categories/
  products/
  modifiers/
  carts/
  orders/
  payments/
  rewards/
  integrations/
  common/
```

Create modules only when implementation requires them.

## Payment Architecture

Provider-specific behavior belongs behind a stable application-facing contract.

Conceptual operations:
- createPayment
- getPaymentStatus
- cancelPendingPayment when supported
- verifyWebhook
- normalizeProviderStatus
- expose provider/channel capabilities

Application payment states must not depend on provider vocabulary.

Normalized states:
- PENDING
- PAID
- EXPIRED
- CANCELLED
- FAILED
- REFUNDED

Order states are separate:
- AWAITING_PAYMENT
- CONFIRMED
- PREPARING
- READY
- PICKED_UP
- COMPLETED
- CANCELLED

A paid payment does not imply a completed order.

## Payment Provider vs Payment Channel

External provider and provider channel are different concepts.

Example:

```text
provider = AUTOGOPAY
channel  = GOPAY_QRIS
```

Other channels may be:
- `SHOPEEPAY_QRIS`
- `INTERACTIVE_QRIS`

The channel determines:
- external reference shape
- create/status endpoint
- whether automatic provider polling exists
- whether a webhook arrives independently
- whether pending cancellation is supported
- whether Fusionify backend polling is required

Do not expose these distinctions to Flutter business logic.

See:
- `docs/adr/0006-autogopay-channel-capabilities.md`
- `docs/integrations/AUTOGOPAY.md`

## AutoGoPay Channel Behavior

Current reviewed behavior:

### GoPay QRIS
- create: `POST /qris/generate`
- status: `POST /qris/status`
- key reference: `transaction_id`
- provider auto-poller: yes
- webhook: automatic
- pending cancel: documented

### ShopeePay QRIS
- create: `POST /shopeepay/qris/create`
- status: `GET /shopeepay/qris/status`
- key reference: `order_sn`
- provider auto-poller: yes
- webhook: automatic
- pending cancel: not documented in reviewed docs

### QRIS Interactive
- create: `POST /interactive/qris/create`
- status: `POST /interactive/qris/status`
- references: `invoice_id` + `ref_no`
- provider auto-poller: not documented
- webhook: triggered by status checking
- pending cancel: not documented

If Interactive is enabled, Fusionify backend owns the bounded polling/reconciliation strategy.

## Webhook Security Boundary

Provider webhooks are untrusted until authenticated.

For AutoGoPay:
- verify HMAC-SHA256 against the raw request body
- use API key only server-side
- use constant-time comparison
- reject invalid signatures before state mutation
- return success quickly after durable/idempotent processing
- deduplicate provider transaction/event identifiers

Do not trust a reconstructed JSON string as canonical signature input unless the provider explicitly guarantees it.

## Checkout Authority

Flutter may submit:
- selected outlet
- requested product IDs
- requested modifier IDs
- quantities
- voucher/reward intent

Flutter must not be authoritative for:
- final item price
- modifier price
- discount amount
- tax/fee
- payment amount
- payment completion

The backend recalculates the payable amount from trusted database state before creating a provider payment.

## Realtime

Realtime is a UX optimization, not the only source of truth.

If a realtime update or webhook is missed, the client must retrieve authoritative current order/payment state through Fusionify API.

## Ledgers

Use auditable movement/transaction records for:
- Rewards points
- Inventory stock movement
- Payment events where appropriate

Do not rely only on mutable balance fields when auditability matters.

## Multi-Outlet

Inventory, availability, order routing, menu availability, and operations are outlet-aware.

Do not model stock as one global quantity when actual inventory belongs to an outlet.

## Security Boundaries

Untrusted boundaries include:
- Mobile client input
- Webhook payloads until authenticated
- External provider responses
- Admin/operator input

Validate at boundaries. Never trust client-supplied payment amount or payment completion.

## Architectural Change

A durable architecture change requires an ADR under `docs/adr/`.
