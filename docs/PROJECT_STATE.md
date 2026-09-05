# Project State

Last updated: 2026-09-05

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public
- Latest fully validated implementation head before this documentation checkpoint: `2e77f6441a4cedf1b45d19e28ec9382cae2c7b0b`
- CI validation run: `33983235952`
- Repository Policy run: `33983235958`

## Current Product State

Fusionify Coffee is no longer only a catalog/cart/payment prototype. The repository currently contains a customer Flutter application, NestJS/PostgreSQL backend, and a separate Next.js staff operations application covering customer identity, ordering, QRIS payment integration code, loyalty/retention foundations, fulfillment, POS/KDS, staff administration, operations data, delivery foundations, and digital benefits.

The largest production-readiness gaps are now external/live integrations and release operations rather than basic application scaffolding.

## Validated Foundations

### Customer Application

- Flutter 3.47 Android/iOS shared codebase
- Material 3
- Riverpod
- GoRouter
- Dio
- Android minSdk 28
- Android compileSdk/targetSdk 36
- no gradients
- secure local session storage
- Android debug APK builds in CI

### Backend

- Node.js 24
- NestJS 11
- Prisma 7
- PostgreSQL 17 in CI
- `@prisma/adapter-pg`
- server-authoritative order and payment boundaries
- database migrations + development seed
- strict lint, unit, e2e, and Nest build in CI

### Staff Application

- separate Next.js 16 staff-facing application under `apps/staff`
- TypeScript strict typecheck
- production Next.js build in CI
- same-origin BFF between staff browser and Fusionify Coffee API
- access/refresh tokens remain in HTTP-only same-site cookies
- staff bearer tokens are not stored in browser localStorage/sessionStorage

## Customer Identity + Account

Implemented:
- Indonesia (+62) and Malaysia (+60) phone normalization
- WhatsApp/SMS OTP delivery abstraction
- 6-digit OTP verification without verification links
- password authentication
- access + refresh sessions
- automatic Flutter access-token refresh with refresh-token rotation
- secure Flutter token storage
- forgot/reset password through OTP
- password reset revokes active sessions
- verified phone-number change through OTP
- phone-number change revokes other active sessions
- active-device/session listing
- individual session revocation
- logout + logout-all
- account deletion through OTP verification
- deleted primary identity anonymization while required transaction records remain separately retained
- authenticated profile/account APIs
- customer-owned order/payment access control

Still not live-validated:
- real production WhatsApp OTP delivery
- real production SMS OTP delivery
- provider credentials, templates, throughput, deliverability, and cost behavior

## Localization

Supported customer languages:
- Bahasa Indonesia: `id-ID` / `ID_ID`
- Bahasa Melayu: `ms-MY` / `MS_MY`
- English: `en` / `EN`

Implemented:
- saved language preference
- global Flutter locale switching
- localized navigation/auth/account/order/checkout/payment copy
- localized backend catalog content
- localized outlet/category/product description/modifier data
- `Accept-Language` sent by the Flutter API client
- safe fallback to stored default text when a translation is missing
- account golden coverage for all three languages

Product names or provider names are not force-translated when they are proper names.

## Catalog, Product, Cart, and Retention

Implemented foundations include:
- PostgreSQL-backed outlet/category/product/modifier catalog
- dynamic modifier groups/options
- server-backed product detail
- cart configuration identity
- quantity/subtotal handling
- favorites
- reorder/buy-again foundations
- vouchers
- Fusion Points ledger/rewards foundations
- membership-tier foundations
- rewards configuration in staff operations
- original preview product artwork for six seeded development products
- three original preview campaign banners with localized backend copy
- original outlet, digital-benefit, empty-state, and loading-animation assets
- backend-driven product/campaign/outlet media references with bundled demo fallbacks
- backend-rank-driven Fusion Blue, Silver, Gold, and Black loyalty credentials
- a provisional Fusion F-Bean adaptive/themed Android icon, iOS icon, and splash concept for development review

Business values such as final membership thresholds and Fusion Points earning/redeem rates remain product configuration decisions and must not be described as final unless explicitly approved.

The visual assets above are provisional preview media. The delivery contract for backend/CDN product, campaign, and outlet URLs is implemented, but production content and content-management operations remain release tasks. The Fusion F-Bean concept is not an approved official logo.

## Checkout + Payment

Implemented:
- authenticated customer checkout
- server-authoritative product/modifier pricing
- Order + OrderItem persistence
- checkout idempotency
- Payment persistence
- payment idempotency
- one pending payment per order database guard
- payment provider/channel abstraction
- AutoGoPay GoPay QRIS adapter
- QRIS create/status/cancel integration code
- raw-body HMAC-SHA256 webhook verification
- native Flutter QR rendering
- authenticated customer order/payment SSE updates
- 30-second authoritative local payment-state fallback
- manual provider reconciliation
- pending cancel
- payment expiry/status UI
- app-resume reconciliation
- verified PAID state changes `AWAITING_PAYMENT` order to `CONFIRMED`

Provider:
- `AUTOGOPAY`

Modeled channels:
- `GOPAY_QRIS` — enabled
- `SHOPEEPAY_QRIS` — modeled, not enabled
- `INTERACTIVE_QRIS` — modeled, not enabled

### AutoGoPay live-validation boundary

No real AutoGoPay transaction has been executed from the validated repository workflow/session.

Still unverified against the real service:
- API credential validity
- merchant/account readiness
- real QR create response
- real expiry behavior
- real webhook payload/signature behavior
- real status response
- real cancel response shape
- settlement/fund flow
- production HTTPS callback reachability

Do not describe AutoGoPay as production-validated yet.

Known create ambiguity:
- the reviewed `/qris/generate` contract does not document a caller-supplied idempotency key
- an ambiguous timeout after provider acceptance may leave Fusionify without the external transaction ID
- do not blindly auto-retry ambiguous provider-create failures

## Order History + Fulfillment

Implemented customer experience:
- authenticated order history
- order detail
- item/modifier breakdown
- persisted `OrderStatusEvent` timeline
- localized ID/MS/EN status descriptions
- pull-to-refresh

Fulfillment flow:
- `AWAITING_PAYMENT -> CONFIRMED` only from verified payment
- `CONFIRMED -> PREPARING`
- `PREPARING -> READY`
- `READY -> PICKED_UP`
- `PICKED_UP -> COMPLETED`

Staff transitions are sequential, outlet scoped, concurrency guarded, and audited.

Implemented staff order APIs include:
- `GET /v1/staff/orders`
- `GET /v1/staff/orders/events`
- `GET /v1/staff/orders/:orderId`
- `POST /v1/staff/orders/:orderId/status`

## Customer Realtime Order + Payment Delivery

Implemented and validated:
- authenticated `GET /v1/orders/events` SSE endpoint
- customer ownership scope on the server-side snapshot query
- latest payment state normalized into safe customer fields
- changed-snapshot suppression through order/payment signatures
- heartbeat approximately every 15 seconds
- Flutter UTF-8 decoding across arbitrary Dio byte chunks
- 45-second client inactivity timeout for silent connections
- reconnect backoff of 1, 2, 4, 8, 16, then at most 30 seconds
- localized connecting/live/recovering customer status
- realtime payment-screen updates
- realtime order-history invalidation
- realtime order-detail/timeline invalidation
- 30-second authoritative GET fallback for payment, history, and detail
- SSE restart plus authoritative reconciliation when the app resumes
- pull-to-refresh and manual payment Check Status remain available

SSE is a delivery optimization, not the source of truth. Authoritative order/payment GET APIs and provider reconciliation remain required.

Current scale boundary:
- the API checks each connected customer's scoped snapshot approximately every 2 seconds
- only changed signatures are emitted
- move the trigger layer to PostgreSQL LISTEN/NOTIFY, Redis Pub/Sub, or an equivalent event bus only when multi-instance/high-throughput deployment requires it

## Staff Authentication + Administration

Staff identity is separate from customer identity. There is no customer `isAdmin` shortcut.

Roles include:
- `SUPER_ADMIN`
- `OWNER`
- `OPERATIONS_MANAGER`
- `OUTLET_MANAGER`
- `CASHIER`
- `BARISTA`
- `INVENTORY_STAFF`
- `CUSTOMER_SUPPORT`
- `FINANCE`

Implemented security:
- password-first staff challenge
- mandatory 6-digit TOTP authenticator enrollment/verification
- standard `otpauth://totp/` enrollment URI
- AES-256-GCM encrypted TOTP secret at rest
- separate staff sessions
- RBAC permission guard
- staff audit log
- server-only initial SUPER_ADMIN bootstrap
- e2e proof of allowed and denied RBAC cases

Implemented management foundations:
- list/create/update staff
- outlet assignment for scoped roles
- suspend/reactivate staff
- privileged password reset
- privileged TOTP reset/re-enrollment
- session revocation after security-sensitive changes
- last-active-SUPER_ADMIN protection
- Team UI for privileged staff

## Staff POS + KDS

### Cashier POS

Implemented:
- responsive staff counter POS
- permission-gated access
- database-backed catalog/modifiers
- guest/walk-in orders with `userId = null`
- idempotent POS order creation
- outlet scope
- browser total clearly treated as estimate
- server-authoritative final price
- QRIS payment initiation through the server-side AutoGoPay adapter
- QR rendering in staff browser
- outlet-scoped payment check/cancel
- failed provider initialization leaves fulfillment unconfirmed
- PAID provider state is required before order confirmation
- confirmed POS orders feed the same KDS queue

Automated POS e2e covers server pricing/idempotency, outlet scope, and safe failure when AutoGoPay is not configured.

### KDS realtime delivery

Validated realtime transport is now implemented with Server-Sent Events (SSE).

Runtime path:

```text
KDS EventSource
  -> GET /api/events/orders
  -> Next.js same-origin BFF
  -> HTTP-only staff session
  -> GET /v1/staff/orders/events
  -> StaffAuthGuard + orders.read + outlet scope
  -> StaffOrderStreamService
  -> PostgreSQL queue snapshot
  -> SSE orders event
```

Current behavior:
- browser opens `EventSource('/api/events/orders')`
- backend checks the active queue snapshot every ~2 seconds
- only changed snapshots emit an `orders` SSE event
- duplicate snapshots are suppressed using an `id/status/updatedAt` signature
- heartbeat event every ~15 seconds
- SSE retry hint: 3 seconds
- outlet-scoped staff receive only their outlet queue
- browser keeps a 30-second fallback refresh if realtime connectivity is recovering
- manual Refresh remains available
- KDS visibly describes `connecting`, `live`, and `fallback` states

Important scaling note:
- SSE is the realtime transport, but the current event source detects database changes through a lightweight 2-second server-side query
- this is suitable for the current deployment foundation
- a multi-instance/high-scale deployment should replace the trigger layer with PostgreSQL LISTEN/NOTIFY, Redis/pub-sub, or equivalent while keeping authoritative order APIs and, if useful, the SSE browser transport

## Operations + Delivery + Digital Benefits

The repository already contains foundations for:
- inventory
- suppliers
- purchase orders
- assets
- saved customer addresses
- delivery/serviceability flows
- digital receipts
- Wi-Fi entitlement/benefit
- AI entitlement/quota benefit

These should not be listed as wholly unimplemented anymore. External provider integrations, deeper operational accounting, and production policy details can still be incomplete depending on the module.

## Validation Evidence

Validated implementation head: `2e77f6441a4cedf1b45d19e28ec9382cae2c7b0b`

GitHub Actions CI run `33983235952`: **PASS**

Customer:
- Flutter pub get: PASS
- Dart format: PASS
- Flutter analyze: PASS
- Flutter tests: PASS
- Android debug APK: PASS

Staff Web:
- npm ci: PASS
- TypeScript strict typecheck: PASS
- Next.js production build: PASS

API:
- PostgreSQL 17 startup: PASS
- Prisma generate: PASS
- migrations: PASS
- development seed: PASS
- lint: PASS
- unit tests: PASS
- e2e tests: PASS
- NestJS build: PASS

Repository Policy run `33983235958`: **PASS**

Current validation includes:
- unit coverage for outlet-scoped staff SSE queue snapshots
- staff application typecheck/build with EventSource KDS
- API lint/unit/e2e/build after SSE integration
- customer SSE model normalization coverage
- chunked UTF-8 SSE parser and inactivity-timeout coverage
- capped reconnect-backoff coverage
- customer localization, analyze, tests, and Android debug APK validation
- preview product/media URL and membership-rank asset mapping coverage
- Android/iOS native visual assets included in the successful customer build

## Explicitly Provisional / Not Final

- Android application ID `id.fusionify.coffee`
- official production Fusionify Coffee logo/media set
- final approval or replacement of the provisional Fusion Bean icon/splash concept
- production API hostname
- AutoGoPay as long-term production provider
- ShopeePay/Interactive runtime enablement
- refund automation
- external maps/courier provider
- final membership thresholds
- final Fusion Points earning/redeem rates
- iOS deployment target

## Genuine Remaining Work

External/live validation:
- production WhatsApp OTP provider configuration and real delivery test
- production SMS OTP provider configuration and real delivery test
- live AutoGoPay customer transaction
- live AutoGoPay staff POS transaction
- real webhook/cancel/status/settlement validation

Production content/release:
- production CDN upload/content-management workflow and approved catalog/campaign media
- official identity approval and platform-icon regeneration
- production API deployment/hostname/TLS
- Android production signing and Play readiness
- iOS deployment/release configuration and App Store readiness
- privacy/Data Safety/account-policy review
- crash/ANR monitoring
- accessibility review

Realtime/scale improvements:
- customer realtime load/connection testing under production-like traffic
- multi-instance event trigger/pub-sub layer for customer and KDS scale

External operations integrations:
- production maps/geocoding/routing provider where required
- courier provider/integration where required
- deeper recipes/BOM/COGS/accounting operations where required

## Next Engineering Priority

1. Keep current green CI baseline.
2. Configure real OTP providers in a secure deployment environment.
3. Deploy API behind production HTTPS.
4. Perform a controlled low-value AutoGoPay live transaction and webhook validation.
5. Replace snapshot polling with pub/sub only when deployment scale actually requires multiple API instances.
6. Complete release signing, store-policy, privacy, accessibility, and monitoring work before production release.
