# Changelog

All notable project changes are documented by meaningful product and engineering milestones rather than generated commit noise.

## Unreleased

### Added

#### Foundation / Ordering
- Repository/agent memory and engineering policies
- Material 3 Flutter Android/iOS foundation
- adaptive NavigationBar/NavigationRail
- no-gradient policy
- PostgreSQL/Prisma 7 catalog persistence
- database-backed menu/modifiers
- cart configuration identity
- Android API 28/36 CI build

#### Milestone 0.2 Checkout / Payment
- OrderStatus and PaymentStatus domain enums
- Order and OrderItem persistence
- Payment persistence
- server-authoritative order pricing
- required/single-select modifier validation
- checkout idempotency
- payment idempotency
- one pending payment per order database guard
- AutoGoPay provider/channel model
- GoPay QRIS adapter
- generate/status/cancel provider calls
- raw-body HMAC-SHA256 webhook verification
- payment amount verification
- transactionally confirm order on PAID
- local payment status endpoint
- mocked AutoGoPay provider unit tests
- unconfigured-provider e2e safety test
- Flutter Checkout screen
- native QRIS rendering with qr_flutter
- local payment polling
- manual Check Status
- pending Cancel Payment
- payment expiry/status UI
- app-resume reconciliation

### Changed

- Runtime catalog uses PostgreSQL through NestJS/Prisma
- Cart checkout is now enabled
- Payment operations remain entirely server-side
- AutoGoPay is modeled as provider + channel, not one uniform QRIS contract
- GoPay QRIS is the first enabled channel
- repository docs now distinguish implemented integration code from live provider validation

### Fixed

- Prisma 7 CommonJS/Jest compatibility
- generated Prisma lint exclusion
- Nest decorated signatures use type-only imports
- payment reservation concurrency race guarded at database level
- Android release no longer uses debug signing
