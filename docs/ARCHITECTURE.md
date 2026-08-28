# Architecture

## High-Level Architecture

```text
Customer App (Flutter)
        |
        | Dio / Riverpod async state
        v
Fusionify Coffee API (NestJS)
        |
        +---- PostgreSQL / Prisma
        |
        +---- Payment Provider Adapter
        |         |
        |         +---- AutoGoPay (initial)
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
```

Rules:
- UI does not silently fall back to fake local data on network failure.
- Loading, error, retry, and refresh states are explicit.
- Tests may override providers with test fixtures.
- API base URL is configuration, not hardcoded production infrastructure.
- Production API should use HTTPS.
- Development HTTP allowance is isolated to platform development configuration.

## Backend Modules

Initial direction:

```text
src/
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

## Persistence

Prisma schema currently defines catalog foundation models, but runtime preview data is still hardcoded at the API layer.

Next persistence step:
- Prisma service
- PostgreSQL environment
- Initial migration
- Development seed
- Database-backed catalog query

Do not claim PostgreSQL-backed behavior until this is implemented and validated.

## Payment Architecture

Provider-specific behavior belongs behind a stable application-facing contract.

Conceptual operations:
- createPayment
- getPaymentStatus
- cancelPendingPayment
- verifyWebhook
- normalizeProviderStatus

Application payment states should not depend on provider vocabulary.

Suggested normalized states:
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

## Realtime

Realtime is an optimization for UX, not the only source of truth.

If a realtime update is missed, the client must be able to retrieve authoritative current order/payment state through the API.

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
