# Architecture

## Current Runtime Path

```text
Flutter Customer App
  |
  | Dio + Riverpod
  v
NestJS API
  |
  +-- Customer Auth / Staff Auth / Accounts / Catalog / Orders / Payments
  +-- Rewards / Retention / Delivery / Operations / Benefits
  |
  v
Prisma 7 + @prisma/adapter-pg
  |
  v
PostgreSQL

Staff Browser
  |
  | same-origin /api/*
  v
Next.js 16 Staff BFF
  |
  | HTTP-only access/refresh cookies
  v
Fusionify Coffee API
```

Payments:

```text
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

Feature-oriented Flutter structure includes customer authentication, catalog, menu/product, cart, checkout/payment, orders, rewards, account, delivery, retention, and benefit surfaces.

Rules:
- presentation does not own provider credentials
- local UI totals are not checkout authority
- network errors do not silently fall back to fake runtime data
- tests may use fixtures/provider overrides
- customer bearer/session secrets remain in secure storage rather than ordinary preferences

## Catalog + Localization Path

```text
Language setting
 -> LocaleController
 -> id-ID / ms-MY / en
 -> Dio Accept-Language
 -> Catalog API
 -> translated JSON catalog fields
 -> localized Flutter models/UI
```

The catalog endpoint also accepts an explicit `lang` query parameter for compatibility. Backend translation falls back to stored default text when a localized value is unavailable.

Dynamic customer-facing catalog content such as outlet notes, category names, product descriptions, modifier-group labels, modifier-option labels, and campaigns is localized at the data/API layer rather than hardcoded independently in Flutter. Product, campaign, and outlet records also carry media references. Production uses HTTP(S) CDN URLs; development seeds can select allowlisted bundled fallbacks with the `asset://` scheme.

## Customer Authentication Boundary

```text
Flutter
 -> phone +62/+60
 -> OTP request (WhatsApp or SMS adapter)
 -> OTP verify
 -> register/login
 -> secure local token storage
 -> access + refresh rotation
 -> authenticated account/order/payment APIs
```

Customer OTP uses a numeric code rather than verification links.

Orders and payments are customer-owned resources. Knowing an order or payment ID is not sufficient authorization.

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

Client sends identifiers and quantities only. The backend owns final pricing.

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

A database constraint prevents more than one local `PENDING` payment per order.

## Payment Detection

Automatic customer-facing delivery uses authenticated account-scoped SSE:

```text
AutoGoPay webhook
 -> raw-body HMAC verification
 -> payment lookup + amount check
 -> normalized state
 -> Payment PAID
 -> Order CONFIRMED

CustomerOrderStreamService
 -> customer-owned orders + latest payment snapshot
 -> changed snapshot only
 -> GET /v1/orders/events
 -> Flutter customer realtime provider
 -> payment, order history, and order detail refresh
```

The current server trigger checks the customer snapshot approximately every 2 seconds. It emits an `account` event only when the order/payment signature changes and sends a heartbeat approximately every 15 seconds.

Flutter treats SSE as an update accelerator rather than payment authority:
- a 45-second inactivity timeout detects a silent connection
- reconnect delay backs off from 1 to 30 seconds
- pending payment screens show localized connecting/live/recovering state
- order history and detail retain a 30-second authoritative GET fallback
- app resume restarts SSE and performs authoritative reconciliation
- pull-to-refresh and manual Check Status remain available

Flutter never calls AutoGoPay directly.

Manual fallback:

```text
Check Status
 -> Fusionify API
 -> AutoGoPay /qris/status
 -> normalize/persist
 -> return local state
```

SSE must not replace authoritative GET/reconciliation APIs.

## Payment Security Boundary

- AutoGoPay key is server-side only
- production callback must use HTTPS
- webhook signature is checked against raw body
- HMAC-SHA256
- constant-time comparison
- provider amount is checked against local payment
- client cannot assert payment completion
- client cannot assert final order amount
- provider raw status is stored separately
- checkout/payment idempotency keys are Fusionify controls

## Provider Create Ambiguity

The reviewed GoPay create contract does not show a caller-supplied external idempotency key.

A timeout after provider acceptance but before response receipt can therefore be ambiguous. Do not blindly auto-retry provider QR creation until a safe reconciliation strategy is validated.

## Order + Fulfillment State

Payment and fulfillment state remain separate.

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

Customer order detail uses persisted `OrderStatusEvent` history rather than inferring a timeline from timestamps.

## Staff Authentication + Operations Boundary

```text
Staff Interface
 -> staff password challenge
 -> TOTP
 -> staff access session
 -> RBAC permission guard
 -> outlet scope
 -> staff order queue/detail
 -> sequential status transition
 -> OrderStatusEvent + StaffAuditLog
```

Customer and staff identities are separate silos. Outlet-scoped roles cannot read or mutate another outlet's orders.

## Staff Web BFF Boundary

```text
Staff Browser
  |
  | same-origin /api/*
  v
Next.js Staff BFF
  |
  | HTTP-only access/refresh cookies
  | server-side token refresh
  v
Fusionify Coffee API
  |
  | StaffAuthGuard + RBAC + outlet scope
  v
Orders / Payments / Staff Management / Operations / Audit
```

Rules:
- staff bearer tokens are never persisted in browser localStorage/sessionStorage
- `FUSIONIFY_API_BASE_URL` is server-only
- browser requests use same-origin BFF route handlers
- backend RBAC and outlet scope remain authoritative

## Cashier POS Path

```text
Staff POS Browser
  -> same-origin Next.js BFF
  -> StaffAuthGuard + orders.manage
  -> outlet-scoped guest Order
  -> backend authoritative catalog/modifier pricing
  -> staff payment endpoint
  -> AutoGoPay GoPay QRIS adapter
  -> Payment PENDING
  -> provider webhook/manual reconciliation
  -> Payment PAID
  -> Order CONFIRMED
  -> KDS queue
```

Rules:
- POS browser totals are estimates only
- staff cannot assert final amount
- staff cannot assert PAID/CONFIRMED
- guest POS orders use `userId = null`
- Idempotency-Key is required for order/payment creation
- outlet scope is enforced by the backend
- failed provider initialization does not advance fulfillment

## Staff Realtime KDS Queue

Validated staff realtime transport uses Server-Sent Events.

```text
KDS Browser EventSource
  |
  | GET /api/events/orders
  v
Next.js Staff BFF
  |
  | HTTP-only staff cookies
  | server-side bearer token
  v
GET /v1/staff/orders/events
  |
  | StaffAuthGuard
  | StaffPermissionsGuard: orders.read
  | outlet scope
  v
StaffOrderStreamService
  |
  | active queue snapshot
  v
PostgreSQL
```

Current behavior:
- KDS browser opens a same-origin `EventSource`
- server checks the active fulfillment queue approximately every 2 seconds
- queue statuses streamed: CONFIRMED, PREPARING, READY, PICKED_UP
- a signature derived from order `id/status/updatedAt` suppresses duplicate snapshots
- changed snapshots emit an SSE event named `orders`
- heartbeat event approximately every 15 seconds
- SSE retry hint is 3 seconds
- browser maintains a 30-second fallback refresh
- manual refresh remains available
- UI exposes human-readable `connecting`, `live`, and `fallback` descriptions

This keeps bearer tokens out of browser JavaScript while providing near-realtime KDS updates.

### Scaling boundary

The browser transport is SSE, but the current trigger layer detects changes using a lightweight database query every ~2 seconds. This is acceptable for the current foundation/single-simple deployment.

For multiple API instances or materially higher order volume, replace the trigger layer with PostgreSQL LISTEN/NOTIFY, Redis/pub-sub, or equivalent. The SSE browser transport can remain if appropriate.

Authoritative GET and status-transition APIs remain the source of truth regardless of realtime transport.

## Retention + Loyalty Boundary

The repository already contains foundations for:
- Fusion Points ledger/rewards
- membership tiers
- vouchers
- favorites
- reorder/buy-again

Final point rates, redemption rules, and membership thresholds remain business configuration rather than architectural constants.

## Operations Boundary

The repository already contains foundations for inventory, suppliers, purchase orders, assets, and staff operations surfaces.

Deeper recipes/BOM, automatic ingredient consumption, COGS, and accounting workflows should be added only when requirements are explicit.

## Delivery Boundary

Saved addresses and delivery/serviceability foundations exist. External maps/geocoding/routing and courier providers should stay behind replaceable adapters rather than leak into customer UI/domain logic.

Manual address/outlet selection should remain available when precise location permission is unnecessary.

## Digital Benefits Boundary

Digital receipt and Wi-Fi/AI entitlement foundations exist. Real outlet Wi-Fi/network operations and AI gateway quota enforcement remain server-side integration concerns.

## Realtime Summary

Implemented:
- staff KDS SSE transport
- authenticated customer order/payment SSE transport
- customer inactivity detection and capped reconnect backoff
- localized customer connection-state UX
- 30-second authoritative customer GET fallback and app-resume reconciliation

Still provider-reconciliation based:
- staff POS pending payment state
- manual customer Check Status

Both staff and customer SSE currently detect changes through lightweight database snapshot polling. A multi-instance/high-throughput deployment can replace that trigger layer with PostgreSQL LISTEN/NOTIFY, Redis Pub/Sub, or an equivalent event bus without removing authoritative state/reconciliation endpoints.

## Architectural Change

Durable architecture changes require an ADR under `docs/adr/`.
