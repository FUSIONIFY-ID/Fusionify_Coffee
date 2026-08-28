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

The interface polls the Fusionify API through the BFF every 10 seconds.
Realtime push/socket delivery is not implemented yet.

## Environment

Configure the server-side API origin:

FUSIONIFY_API_BASE_URL=https://api.example.com

The API origin is intentionally server-only, not a NEXT_PUBLIC value.
