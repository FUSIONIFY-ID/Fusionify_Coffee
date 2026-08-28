# Project State

Last updated: 2026-08-28

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public
- Latest fully validated implementation head: `a139346b5dab4d5cb53bfa8b6eb5c02356cefd56`

## Current Milestone

**Milestone 0.2 Pickup Checkout + Payment is implemented through the provider-integration boundary. Live AutoGoPay validation is still pending.**

The end-to-end application architecture now reaches:

```text
Flutter
  -> Fusionify Coffee API
  -> server-authoritative checkout
  -> Order + Payment persistence
  -> AutoGoPay GoPay QRIS adapter
```

The application can render a provider QR string natively and manage local payment state, but no real AutoGoPay API key or live transaction was used in repository CI.

## Completed

### Foundation
- Flutter 3.47 Android+iOS
- Material 3
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- NestJS 11
- Node.js 24
- Prisma 7
- PostgreSQL 17 CI
- `@prisma/adapter-pg`
- Android minSdk 28
- Android compileSdk/targetSdk 36
- No gradients
- Repository secret/signing policy

### Authentication / Customer Account
- Indonesia (+62) and Malaysia (+60) phone normalization
- 6-digit OTP challenge flow
- WhatsApp/SMS delivery adapter boundary
- password authentication
- hashed OTP/password/session secrets
- access + refresh sessions
- automatic Flutter access-token refresh with refresh-token rotation
- one-time retry of an authenticated request after token refresh
- secure Flutter token storage
- logout + logout-all
- forgot/reset password through verified OTP
- password reset revokes active sessions
- verified phone-number change through OTP
- phone-number change revokes other active sessions
- active-device/session listing
- individual session revocation
- account deletion through OTP verification
- deleted customer primary identity is anonymized while transaction records remain separately retained
- authenticated account/profile endpoints
- order/payment ownership bound to authenticated customer


### Staff/Admin Authentication + Authorization
- separate staff identity/session silo; customer accounts cannot become admin through a customer flag
- staff roles: `SUPER_ADMIN`, `OWNER`, `OPERATIONS_MANAGER`, `OUTLET_MANAGER`, `CASHIER`, `BARISTA`, `INVENTORY_STAFF`, `CUSTOMER_SUPPORT`, `FINANCE`
- explicit permission mapping for orders, catalog, customers, inventory, finance, staff, audit, and system operations
- password-first staff login challenge
- mandatory 6-digit TOTP authenticator enrollment/verification
- standard `otpauth://totp/` enrollment URI
- TOTP secret encrypted at rest with AES-256-GCM
- separate staff access/refresh sessions
- RBAC permission guard
- staff audit log foundation
- server-side-only initial `SUPER_ADMIN` bootstrap command
- staff login/TOTP/RBAC e2e coverage
- e2e proof that `SUPER_ADMIN` can read audit logs while `CASHIER` receives HTTP 403

Implemented staff APIs:
- `POST /v1/staff/auth/login`
- `POST /v1/staff/auth/totp/setup`
- `POST /v1/staff/auth/totp/verify`
- `POST /v1/staff/auth/refresh`
- `GET /v1/staff/me`
- `POST /v1/staff/auth/logout`
- `GET /v1/staff/audit-logs` with RBAC

Initial staff bootstrap:
- `npm run staff:bootstrap`
- requires server-side bootstrap environment values
- first login requires TOTP enrollment

### Localization
- Bahasa Indonesia (`id-ID` / `ID_ID`)
- Bahasa Melayu (`ms-MY` / `MS_MY`)
- English (`en` / `EN`)
- saved customer language preference
- global Flutter locale switching
- localized navigation/auth/account/checkout/payment states
- localized backend catalog content
- localized outlet/category/product/modifier data
- `Accept-Language` sent automatically by the Flutter API client
- catalog API still supports explicit `lang` for compatibility
- fallback to default catalog text when a translation is missing
- golden account UI coverage for all three supported languages

### Catalog / Cart
- PostgreSQL-backed development catalog
- Outlet/category/product/modifier models
- Dynamic modifier groups
- Server-backed product detail
- Distinct cart identity by configuration
- Quantity/subtotal behavior

### Order Persistence
- `OrderStatus`
- `Order`
- `OrderItem`
- unique checkout idempotency key
- product/modifier snapshots
- outlet relation
- server-calculated subtotal/total
- required modifier validation
- single-select modifier validation
- unknown/duplicate modifier rejection

### Payment Persistence
- `PaymentStatus`
- `PaymentProvider`
- `PaymentChannel`
- `Payment`
- unique payment idempotency key
- AutoGoPay external reference fields
- provider QR/expiry fields
- payment timestamps
- one pending payment per order enforced at database level

### Order API
- `POST /v1/orders`
- `GET /v1/orders`
- `GET /v1/orders/:orderId`

`GET /v1/orders` returns only the authenticated customer's orders and is used by the Flutter Orders tab.

Checkout only accepts product IDs, modifier option IDs, quantities, and outlet context from the client. Final price is recalculated from trusted database state.

### Payment API
- `POST /v1/orders/:orderId/payments`
- `GET /v1/payments/:paymentId`
- `POST /v1/payments/:paymentId/check`
- `POST /v1/payments/:paymentId/cancel`
- `POST /v1/webhooks/autogopay`

Only `GOPAY_QRIS` is enabled in the first runtime adapter.

### AutoGoPay GoPay Adapter
- create via `POST /qris/generate`
- status via `POST /qris/status`
- cancel via `POST /qris/cancel`
- Bearer API key server-side only
- 10-second request timeout
- amount verification
- normalized payment state
- raw-body webhook verification
- HMAC-SHA256
- constant-time signature comparison
- QR/payment external references persisted

### Payment State Effects
- `PENDING`
- `PAID`
- `EXPIRED`
- `CANCELLED`
- `FAILED`
- `REFUNDED`

When a payment becomes `PAID`, the backend transactionally changes an `AWAITING_PAYMENT` order to `CONFIRMED`.

### Flutter Checkout
- Cart Checkout CTA
- Pickup outlet summary
- Order summary
- local estimated subtotal
- explicit server-price-authority disclosure
- stable checkout idempotency key per screen operation
- stable payment idempotency key per screen operation
- error handling for unavailable backend/provider

### Flutter QRIS Payment
- `qr_flutter 4.1.0`
- QR rendered natively from backend `qrString`
- no camera permission required to display QR
- amount display
- provider expiry countdown when parseable
- local payment status polling every ~3 seconds
- local polling calls Fusionify API, not AutoGoPay
- manual Check Status reconciliation
- pending Cancel Payment
- app-resume provider reconciliation
- PAID/EXPIRED/CANCELLED/FAILED states
- cart clears only after payment becomes PAID

## AutoGoPay Channel Architecture

Provider:
- `AUTOGOPAY`

Channels modeled:
- `GOPAY_QRIS`
- `SHOPEEPAY_QRIS`
- `INTERACTIVE_QRIS`

Only GoPay QRIS is enabled in current runtime code.

See:
- `docs/integrations/AUTOGOPAY.md`
- `docs/adr/0006-autogopay-channel-capabilities.md`

## Validation Evidence

GitHub Actions run `33166925122` for implementation head `a139346b5dab4d5cb53bfa8b6eb5c02356cefd56`: **PASS**

Customer:
- Dart format: PASS
- Flutter analyze: PASS
- Flutter tests: PASS
- Android debug APK build: PASS

API:
- PostgreSQL 17 startup: PASS
- Prisma generate: PASS
- migrations: PASS
- development seed: PASS
- lint: PASS
- unit tests: PASS
- e2e tests: PASS
- NestJS build: PASS

Repository Policy:
- PASS

## What Automated Tests Prove

Automated validation covers:
- database migrations
- seeded PostgreSQL catalog
- server-authoritative order pricing
- checkout idempotency
- invalid modifier rejection
- safe behavior when AutoGoPay is not configured
- customer register/profile authentication
- customer order ownership
- staff password + TOTP login
- TOTP encrypted-secret utility behavior
- staff session creation
- staff RBAC denial for insufficient permission
- staff audit-log access for authorized role
- provider QR response normalization with mocked fetch
- raw-body HMAC webhook verification
- Flutter payment model parsing
- Flutter application compilation/analyze/tests

## What Is NOT Yet Proven

No live AutoGoPay transaction has been executed from this repository/session.

Still unverified against the real service:
- API credential validity
- production merchant/account readiness
- real create response
- real webhook payload/signature behavior
- real status response
- real cancel response shape
- settlement/fund flow
- production HTTPS callback reachability

Do not describe AutoGoPay as production-validated yet.

## Known Provider Limitation

The reviewed `/qris/generate` contract accepts `amount` but does not document a caller-supplied idempotency key.

If a network failure occurs after AutoGoPay receives a create request but before Fusionify receives the response, the backend may not have the provider transaction ID required for deterministic reconciliation.

Current rule:
- do not aggressively auto-retry ambiguous provider-create failures
- keep Fusionify checkout/payment idempotency
- validate live provider behavior before production
- consider an operator/reconciliation flow if the provider cannot offer idempotent creation

## Explicitly Provisional / Not Final

- Android application ID `id.fusionify.coffee`
- official Fusionify Coffee logo/media
- coffee-specific accent palette
- production API hostname
- AutoGoPay as long-term production provider
- ShopeePay/Interactive runtime enablement
- refund automation
- maps/courier provider
- membership thresholds
- Fusion Points rates
- iOS deployment target

## Not Implemented Yet

- production OTP provider credentials/live delivery validation
- production catalog/media
- scheduled pickup
- realtime socket/push delivery of payment changes
- order detail/tracking UI
- staff/admin management UI
- staff invitation/creation lifecycle beyond initial bootstrap
- staff TOTP recovery/reset operator procedure
- POS/KDS
- Fusion Points
- membership
- vouchers
- delivery/maps
- inventory/procurement/assets
- digital Wi-Fi/AI benefits
- production release signing
- live AutoGoPay validation

## Next Work

### Milestone 0.2 Live Integration Validation
1. Configure `AUTOGOPAY_API_KEY` only in a secure runtime secret store.
2. Deploy Fusionify API behind HTTPS.
3. Configure the AutoGoPay callback URL.
4. Run a controlled low-value QRIS test.
5. Validate actual create response and expiry behavior.
6. Validate automatic webhook signature using raw body.
7. Validate local Flutter polling observes webhook-updated state.
8. Validate manual Check Status.
9. Validate pending Cancel behavior and response shape.
10. Record provider-specific evidence without committing credentials.

### Milestone 0.3 Work Already Started
Implemented:
- authenticated customer order history API
- Flutter Orders history tab
- staff/admin identity silo
- staff password + TOTP authentication
- staff RBAC + audit foundation

Next:
- order detail
- staff-managed order transition API
- CONFIRMED -> PREPARING -> READY -> PICKED_UP -> COMPLETED
- POS/KDS minimum workflow
- staff management lifecycle
- Fusion Points ledger/earning
