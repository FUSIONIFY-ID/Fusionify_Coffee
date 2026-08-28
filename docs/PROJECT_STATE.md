# Project State

Last updated: 2026-08-28

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public
- Latest fully validated implementation head before this documentation checkpoint: `93cc894fb725900f15db5a52c1aec6858f8c295c`

## Current Milestone

**Milestone 0.1 Ordering Foundation is complete and validated.**

The customer application consumes database-backed development catalog data through:

```text
Flutter
  -> Dio
  -> NestJS
  -> Prisma 7
  -> PostgreSQL
```

The next implementation milestone is **0.2 Pickup Checkout + Payment**.

## Completed

### Repository Foundation
- Repository rules and `AGENTS.md`
- Claude, Gemini, Copilot, and Cursor guidance
- Project skills and project-memory workflow
- Security/contribution templates
- No-gradient and signing/secret repository policy

### Material 3 Customer Foundation
- Flutter 3.47 Android+iOS scaffold
- Material 3 `useMaterial3: true`
- Fusionify seed-based Material 3 `ColorScheme`
- Material 2021 typography baseline
- Semantic solid-color tokens
- Material-themed AppBar/cards/buttons/chips/inputs/sheets/snackbars/progress
- Edge-to-edge UI
- Material 3 `NavigationBar` on phone
- Adaptive `NavigationRail` on wide/tablet layouts
- No gradients
- Dynamic system recoloring intentionally not enabled

### Customer Ordering
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- Android minSdk 28, compileSdk 36, targetSdk 36
- Async API-backed Home/Menu
- Pull-to-refresh
- Loading skeleton
- Error + retry state
- Database-backed development outlet/menu/categories
- Product detail
- Dynamic modifier groups
- Size, temperature, sugar, ice, milk, add-ons
- Modifier-aware pricing
- Distinct cart configuration identity
- Quantity changes/removal
- Cart subtotal
- Honest disabled states for unimplemented checkout/delivery/rewards/auth

### API / Database
- Node.js 24
- NestJS 11
- Prisma 7
- `@prisma/adapter-pg`
- PostgreSQL
- Prisma service/database module
- Initial catalog migration
- Development seed
- Database-backed catalog query
- Outlet
- Category
- Product
- ModifierGroup
- ModifierOption
- `GET /v1/health`
- `GET /v1/catalog/preview`

### AutoGoPay Documentation Revalidation

Provider docs were re-reviewed on 2026-08-28.

Current documented QRIS channels:
- GoPay QRIS
- ShopeePay QRIS
- QRIS Interactive

QRIS Interactive is documented as replacing OrderKuota.

Important architecture update:
- GoPay/ShopeePay document provider-side auto-polling + webhook.
- QRIS Interactive requires status checking for payment detection and its webhook is triggered during manual status checking.
- Cancellation is currently documented for GoPay QRIS, not for ShopeePay/Interactive in the reviewed docs.
- AutoGoPay integration must therefore be channel-aware.

ADR:
- `docs/adr/0006-autogopay-channel-capabilities.md`

Detailed contract:
- `docs/integrations/AUTOGOPAY.md`

### Validation / CI

Latest validated implementation pipeline: **PASS**

Customer:
- Dart format: PASS
- Flutter analyze: PASS
- Flutter tests: PASS
- Android debug APK compile: PASS

API:
- PostgreSQL 17 service startup: PASS
- Prisma generate: PASS
- Migration deploy: PASS
- Database seed: PASS
- API lint: PASS
- API unit tests: PASS
- API e2e tests against seeded PostgreSQL: PASS
- API build: PASS

Repository policy:
- PASS
- No-gradient check: PASS
- Secret/signing-file checks: PASS
- Debug signing rejection policy: PASS

## Accepted Decisions

- Customer app: Flutter + Dart
- Material 3 UI foundation
- Fusionify brand colors override dynamic system recoloring
- Adaptive phone/tablet navigation
- Riverpod
- GoRouter
- Dio
- NestJS + TypeScript
- PostgreSQL + Prisma
- Prisma 7 PostgreSQL driver adapter
- Android minSdk 28
- Android compileSdk 36
- Android targetSdk 36
- Android AAB release
- Play App Signing
- AutoGoPay is the initial temporary payment provider
- AutoGoPay integration is channel-aware
- GoPay QRIS is the recommended Milestone 0.2 initial channel
- Provider secrets remain server-side
- Payment-provider abstraction is required
- No gradients
- No AI slop
- No vibe coding
- No AI-style overengineering

## Explicitly Provisional / Not Final

- Android generated application ID: `id.fusionify.coffee`
- Official Fusionify Coffee logo assets
- Coffee-specific warm accent palette
- iOS minimum deployment target
- Production API host/domain
- Maps provider
- Delivery/courier provider
- Membership tier thresholds and benefits
- Fusion Points earning/redemption rates
- Refund provider/process
- Long-term production payment provider
- Whether ShopeePay/QRIS Interactive are exposed after initial GoPay integration

## Development Preview Data

The catalog is now PostgreSQL-backed, but the seeded outlet/products/prices/modifiers are fictional development fixtures.

They are not production business data.

## Not Implemented Yet

- Authentication
- Real outlet discovery
- Real product photography/assets
- Pickup checkout
- Server-authoritative order pricing
- Order/Payment models
- AutoGoPay runtime adapter
- Payment webhook/reconciliation
- QRIS UI
- Order tracking
- Fusion Points ledger
- Membership
- Delivery/maps
- POS
- KDS
- Inventory
- Procurement
- Assets/maintenance
- Wi-Fi benefit
- AI benefit
- Production release signing

## Next Work

### Milestone 0.2 Pickup Checkout + Payment

1. Add Order + OrderItem + Payment persistence models.
2. Add server-authoritative checkout calculation.
3. Add normalized order/payment state machines.
4. Implement payment provider interface + capability model.
5. Implement AutoGoPay GoPay QRIS adapter first.
6. Create QRIS server-side.
7. Return only safe payment data to Flutter.
8. Render `qr_string` natively in Flutter.
9. Add authoritative payment status endpoint.
10. Verify AutoGoPay raw-body HMAC webhook.
11. Add webhook/status idempotency.
12. Implement pending cancellation only when provider/channel supports it.
13. Handle expiry/background/resume/reconnect reconciliation.
14. Add bounded backend polling strategy for future QRIS Interactive support.
15. Keep paid-order refund/cancellation separate from pending payment cancellation.

## Validation Evidence

GitHub Actions run for implementation head `93cc894fb725900f15db5a52c1aec6858f8c295c` completed successfully for:
- Customer CI
- API/PostgreSQL CI
- Repository Policy
