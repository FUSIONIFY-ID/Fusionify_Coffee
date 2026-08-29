# Fusionify Coffee Staff Operations

Separate staff-facing web interface for KDS and staff administration.

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
- local order-status polling until payment confirmation
- manual payment status reconciliation
- paid POS orders enter the same KDS fulfillment queue
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

The KDS polls the Fusionify API through the BFF every 10 seconds.
The POS polls the local Fusionify order state while a QRIS payment is pending.
Realtime push/socket delivery is not implemented yet.

POS pricing displayed in the browser is only an estimate. The API reloads active
products/modifiers and recalculates the authoritative order total before
payment creation.

## Environment

Configure the server-side API origin:

FUSIONIFY_API_BASE_URL=https://api.example.com

The API origin is intentionally server-only, not a NEXT_PUBLIC value.
