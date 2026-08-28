# Roadmap

Roadmap items describe planned sequencing and verified status.

## Foundation

Status: **Complete**

- Repository rules/project memory
- Architecture/product documentation
- Android/iOS policy
- Material 3 design system
- Security baseline
- PostgreSQL/Prisma foundation

## Milestone 0.1: Ordering Foundation

Status: **Complete**

- Flutter Android/iOS scaffold
- NestJS API
- Material 3
- adaptive navigation
- database-backed outlet/category/product/modifiers
- product customization
- cart
- Dio/Riverpod API boundary
- PostgreSQL migration/seed/CI

Success condition met:
A product can be configured and added to cart as a distinct configuration using database-backed development data.

## Milestone 0.2: Pickup Checkout + Payment

Status: **Implementation complete; live AutoGoPay validation pending**

Implemented:
- pickup outlet context
- server-authoritative order calculation
- Order + OrderItem
- Payment
- order/payment state enums
- checkout idempotency
- payment idempotency
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

Still required before claiming milestone production-ready:
- secure live API key configuration
- HTTPS callback
- real low-value provider transaction
- real webhook verification
- real status/cancel response validation
- provider operational/settlement review

## Milestone 0.3: Fulfillment + Fusion Points

Status: **Partially in progress**

Implemented:
- authenticated customer order history API
- Flutter order history
- separate staff/admin identity model
- staff password + TOTP authenticator login
- staff access/refresh sessions
- staff RBAC permission foundation
- staff audit log foundation
- server-side initial SUPER_ADMIN bootstrap
- e2e staff TOTP/RBAC validation

Remaining:
- order detail
- order tracking
- staff-managed order state transitions
- POS/KDS minimum flow
- preparing
- ready
- picked up
- completed
- staff management lifecycle
- rewards ledger
- Fusion Points earning

## Milestone 0.4: Retention

- rewards catalog
- point redemption
- vouchers
- favorites
- reorder
- membership tiers
- campaigns/missions

## Milestone 0.5: Operations

- recipes/BOM
- ingredients/packaging/supplies
- outlet inventory
- stock movements
- waste
- stock opname
- transfer
- supplier/purchasing/receiving
- COGS
- assets/maintenance

## Milestone 0.6: Delivery

- saved addresses
- location permission UX
- maps/search/pin
- serviceability
- route distance/fees
- outlet routing
- courier abstraction
- tracking

## Milestone 0.7: Digital Benefits

- digital receipt
- Wi-Fi entitlement
- AI entitlement/quota
- membership-linked benefits

## Release Readiness

Before production:
- live payment provider validation
- Android Play policy re-check
- iOS App Store policy re-check
- privacy policy/Data Safety
- account deletion ✅ implemented with OTP verification and identity anonymization
- signing/package verification
- SDK audit
- security review
- crash/ANR monitoring
- accessibility review
