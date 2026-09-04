# Roadmap

Roadmap items describe planned sequencing and verified status.

## Foundation

Status: **Complete**

Implemented:
- repository rules/project memory
- architecture/product documentation
- Android/iOS policy
- Material 3 design system
- security baseline
- PostgreSQL/Prisma foundation
- CI for customer, API, staff web, and repository policy

## Milestone 0.1: Ordering Foundation

Status: **Complete**

Implemented:
- Flutter Android/iOS scaffold
- NestJS API
- Material 3
- adaptive customer navigation
- database-backed outlet/category/product/modifiers
- localized catalog descriptions
- product customization
- cart
- Dio/Riverpod API boundary
- PostgreSQL migration/seed/CI

Success condition met: a database-backed product can be configured and added to cart as a distinct configuration.

## Milestone 0.2: Pickup Checkout + Payment

Status: **Implementation complete; live AutoGoPay validation pending**

Implemented:
- pickup outlet context
- server-authoritative order calculation
- Order + OrderItem
- Payment
- order/payment state enums
- checkout/payment idempotency
- one-pending-payment-per-order guard
- payment provider/channel abstraction
- AutoGoPay GoPay QRIS adapter
- QRIS create/status/cancel integration code
- raw-body HMAC webhook verification
- native Flutter QR rendering
- local payment polling
- manual provider reconciliation
- pending cancel UI
- payment expiry/status UI
- app-resume reconciliation
- PAID -> Order CONFIRMED transition
- same payment foundation reused by staff POS

Still required before production-ready claim:
- secure live API key configuration
- HTTPS callback
- real low-value provider transaction
- real webhook verification
- real status/cancel response validation
- provider settlement/operational review

## Milestone 0.3: Fulfillment + Staff Operations

Status: **Core implementation complete**

Implemented:
- authenticated customer order history
- customer order detail + persisted status timeline
- separate staff/admin identity model
- staff password + TOTP authenticator login
- staff access/refresh sessions
- RBAC permission foundation
- audit log foundation
- initial SUPER_ADMIN bootstrap
- staff management lifecycle APIs
- Team/staff-management UI
- outlet-scoped staff order queue/detail APIs
- sequential fulfillment transitions
- Staff operations web (Next.js 16)
- HTTP-only-cookie BFF staff session boundary
- responsive KDS
- cashier POS
- staff POS QRIS initiation
- realtime staff KDS transport via SSE
- 30-second browser fallback refresh
- API/staff/customer CI validation

Validated fulfillment progression:
- CONFIRMED -> PREPARING
- PREPARING -> READY
- READY -> PICKED_UP
- PICKED_UP -> COMPLETED

Remaining production/scale work:
- live AutoGoPay POS validation
- multi-instance realtime trigger/pub-sub layer when scale requires it
- optional customer realtime order updates

## Milestone 0.4: Retention + Loyalty

Status: **Foundation implemented**

Implemented repository foundations:
- Fusion Points ledger/rewards
- membership tiers
- vouchers
- favorites
- reorder/buy-again
- staff rewards configuration

Still product-dependent:
- final point earning rate
- final redemption rules
- final membership thresholds
- campaign/mission strategy
- production abuse/fraud controls

## Milestone 0.5: Operations

Status: **Foundation implemented; deeper operations remain**

Implemented repository foundations:
- inventory
- suppliers
- purchase orders
- assets
- staff operations interfaces/APIs

Potential deeper work depending on operational requirements:
- recipes/BOM
- ingredient-level automatic consumption
- waste workflows
- stock opname depth
- transfer workflows
- receiving/accounting depth
- COGS
- maintenance scheduling/reporting depth

## Milestone 0.6: Delivery

Status: **Foundation implemented; external integrations remain**

Implemented repository foundations:
- saved addresses
- delivery/serviceability flows

Remaining production work may include:
- production maps/geocoding/search provider
- route-distance/fee provider rules
- outlet routing policies
- courier abstraction/provider
- courier tracking
- location permission UX/policy finalization where location is actually used

## Milestone 0.7: Digital Benefits

Status: **Foundation implemented**

Implemented repository foundations:
- digital receipt
- Wi-Fi entitlement/benefit
- AI entitlement/quota benefit
- membership-linked benefit architecture

Remaining production work:
- real outlet Wi-Fi integration/credential lifecycle
- real AI gateway/quota operations
- abuse/rate-limit policies
- operational support/recovery procedures

## Realtime Roadmap

### Staff KDS

Status: **Implemented with SSE**

Current architecture:
- KDS browser uses same-origin `EventSource`
- Next.js BFF keeps staff bearer tokens server-side
- NestJS staff SSE endpoint is protected by staff auth/RBAC/outlet scope
- active queue snapshot is checked about every 2 seconds server-side
- only changed queue signatures emit order events
- heartbeat approximately every 15 seconds
- browser fallback refresh every 30 seconds

Future scaling option:
- replace the 2-second database trigger with PostgreSQL LISTEN/NOTIFY, Redis/pub-sub, or equivalent for multi-instance/high-scale deployment

### Customer order/payment updates

Status: **Authoritative polling/reconciliation implemented; push optimization remains**

Do not remove authoritative GET/provider-reconciliation APIs when adding push delivery.

## Release Readiness

Before production:
- live payment provider validation
- production WhatsApp OTP validation
- production SMS OTP validation
- production API/TLS deployment
- official production catalog/media
- Android Play policy re-check
- iOS App Store policy re-check
- privacy policy/Data Safety
- account deletion ✅ implemented with OTP verification and identity anonymization
- signing/package verification
- SDK/security audit
- crash/ANR monitoring
- accessibility review
- operational monitoring/alerting

## Next Priorities

1. Preserve the current green CI baseline.
2. Configure and validate real WhatsApp/SMS OTP providers.
3. Deploy the API behind production HTTPS.
4. Run controlled live AutoGoPay create/webhook/status/cancel tests.
5. Complete production catalog/media and release signing.
6. Add customer realtime order/payment delivery if it materially improves UX.
7. Introduce a pub/sub trigger layer for KDS only when deployment scale requires it.
