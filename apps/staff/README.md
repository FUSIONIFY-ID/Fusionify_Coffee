# Fusionify Coffee Staff Operations

Separate staff-facing web interface for POS, KDS, operations, and staff administration.

## Security model

Browser code never receives long-lived staff access or refresh tokens.

The Next.js route-handler layer acts as a BFF:
- staff login password challenge is proxied server-side
- TOTP setup/verification is proxied server-side
- access/refresh tokens are stored in HTTP-only same-site cookies
- authenticated staff API calls pass through the BFF
- expired access tokens are refreshed server-side
- backend RBAC and outlet scoping remain authoritative

Do not convert the staff session to localStorage/sessionStorage tokens.

## Current interface

- cashier POS counter order entry
- database-backed menu + modifier configuration
- server-authoritative POS order pricing
- guest/walk-in order creation
- GoPay QRIS initiation
- QR rendering in the staff browser
- pending payment status/reconciliation
- paid POS orders enter the shared KDS fulfillment queue
- staff login
- first-login TOTP setup
- 6-digit authenticator verification
- KDS queue: Confirmed / Preparing / Ready / Picked Up
- sequential fulfillment actions
- staff order detail + backend fulfillment log
- privileged Team screen
- create staff
- suspend/reactivate staff
- reset staff TOTP
- rewards/operations administration foundations

## Realtime KDS

The KDS now uses authenticated Server-Sent Events instead of depending on a 10-second browser polling loop.

Browser path:

```text
EventSource('/api/events/orders')
  -> Next.js same-origin BFF
  -> HTTP-only staff session
  -> GET /v1/staff/orders/events
  -> staff auth + orders.read permission + outlet scope
  -> SSE orders events
```

Current behavior:
- initial authoritative queue load still runs when the KDS opens
- active queue changes are detected server-side approximately every 2 seconds
- unchanged snapshots are suppressed
- changed snapshots arrive through an SSE event named `orders`
- heartbeat is sent approximately every 15 seconds
- EventSource receives a 3-second retry hint
- browser keeps a 30-second fallback refresh while realtime connectivity recovers
- manual Refresh remains available
- KDS visibly describes `connecting`, `live`, and `fallback` states

The SSE path does not expose the staff bearer token to browser JavaScript because the same-origin BFF authenticates the upstream stream with the HTTP-only session.

### Scaling note

The current SSE source detects queue changes with a lightweight PostgreSQL query every ~2 seconds. This is an intentional initial implementation, not a claim of a distributed event bus.

For multi-instance or materially higher-volume deployments, the trigger layer should move to PostgreSQL LISTEN/NOTIFY, Redis/pub-sub, or equivalent. Authoritative order APIs remain the source of truth.

## POS payment state

The POS still reads authoritative local Fusionify payment/order state while a QRIS payment is pending and can explicitly reconcile through the server-side provider adapter.

Realtime KDS delivery is separate from payment-provider confirmation. Staff UI never asserts `PAID` or `CONFIRMED` on its own.

## Pricing authority

POS pricing displayed in the browser is only an estimate. The API reloads active products/modifiers and recalculates the authoritative order total before payment creation.

## Environment

Configure the server-side API origin:

```text
FUSIONIFY_API_BASE_URL=https://api.example.com
```

The API origin is intentionally server-only, not a `NEXT_PUBLIC` value.
