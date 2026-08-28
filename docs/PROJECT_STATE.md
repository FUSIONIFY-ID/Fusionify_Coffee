# Project State

Last updated: 2026-08-28

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public

## Current Milestone

Milestone 0.1 API-backed ordering foundation is complete as a development preview.

The customer app now retrieves preview outlet/menu/modifier data from the NestJS API through Dio + Riverpod. Runtime no longer uses a local catalog fixture. PostgreSQL persistence is not connected yet, so the API response itself remains clearly labeled development preview data.

## Completed

### Repository Foundation
- Repository rules and `AGENTS.md`
- Claude, Gemini, Copilot, and Cursor guidance
- Project skills and project-memory workflow
- Security/contribution templates
- No-gradient and signing/secret repository policy

### Material 3 Customer Foundation
- Flutter 3.47 Android+iOS scaffold
- Material 3 enabled through `useMaterial3: true`
- Material 3 seed-based `ColorScheme` anchored to Fusionify blue
- Material 2021 typography baseline with Fusionify hierarchy overrides
- Semantic solid-color tokens
- Themed AppBar, cards, buttons, chips, inputs, bottom sheets, snackbars, progress indicators
- Edge-to-edge system UI setup
- Material 3 `NavigationBar` on phone layouts
- Adaptive Material 3 `NavigationRail` on wide/tablet layouts
- No gradients
- No dynamic Material You recoloring that would override locked Fusionify brand identity

### Customer Ordering
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- Android minSdk 28, compileSdk 36, targetSdk 36
- Home and menu use async API state
- Pull-to-refresh on Home
- Explicit loading skeleton
- Explicit network error + retry state
- API-backed preview outlet
- API-backed category/menu browsing
- API-backed product detail
- API-backed modifier groups for size, temperature, sugar, ice, milk, and add-ons
- Modifier-aware price calculation
- Cart item identity by product configuration
- Quantity increment/decrement/remove
- Cart subtotal
- Honest disabled states for checkout/delivery/rewards/auth not implemented yet
- Runtime local catalog fixture removed

### API Boundary
- API base URL configuration through `--dart-define=API_BASE_URL=...`
- Development defaults:
  - Android emulator: `http://10.0.2.2:3000`
  - iOS simulator/local host: `http://127.0.0.1:3000`
- Dio provider with connection/send/receive timeouts
- Catalog repository
- Riverpod `FutureProvider` for catalog state
- JSON parsing models for outlet/product/modifiers
- Android debug-only cleartext local API allowance
- iOS local networking allowance for development
- Production API is expected to use HTTPS

### Backend
- Node.js 24 toolchain
- NestJS 11
- Prisma 7 + PostgreSQL schema foundation
- `GET /v1/health`
- `GET /v1/catalog/preview`
- Modifier-aware preview catalog response
- Initial Outlet, Category, Product, ModifierGroup, ModifierOption schema

### Validation / CI
- Dart format: PASS
- Flutter analyze: PASS
- Flutter tests: PASS, 3 test cases
- Android debug APK compile: PASS
- API lint: PASS
- API unit tests: PASS
- API e2e tests: PASS
- API build: PASS
- Repository policy: PASS
- No-gradient check: PASS
- Secret/signing-file checks: PASS
- Debug signing rejection policy: PASS

## Accepted Decisions

- Customer app: Flutter + Dart
- Material 3 is the UI foundation
- Fusionify brand colors remain authoritative over system dynamic recoloring
- Adaptive phone/tablet navigation is part of the UI foundation
- State management: Riverpod
- Routing: GoRouter
- Networking: Dio
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Android minSdk: 28
- Android compileSdk: 36
- Android targetSdk: 36
- Android release: AAB
- Play App Signing strategy
- AutoGoPay is the initial temporary payment provider
- Provider secrets remain server-side
- Payment provider abstraction is required
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

Do not turn these into final decisions without explicit project approval.

## Development Preview Data

`/v1/catalog/preview` returns fictional development data.

The Flutter app consumes that endpoint for real network-state behavior, but the outlet, menu names, prices, bestseller status, and modifier configuration are still fixtures.

They are not production business data.

## Not Implemented Yet

- PostgreSQL persistence/migrations for live catalog
- Authentication
- Real outlet discovery
- Real product photography/assets
- Pickup checkout
- Server-side order pricing
- AutoGoPay integration
- Payment webhook/reconciliation
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

### Milestone 0.1 Data Persistence Completion
1. Add Prisma service/database module.
2. Create the first catalog migration when PostgreSQL environment is defined.
3. Seed development outlet/category/product/modifier records.
4. Replace hardcoded API preview response with database-backed preview/query logic.
5. Keep loading/error/retry behavior in Flutter unchanged.

### Milestone 0.2 Pickup Checkout + QRIS
After database-backed catalog:
1. Create server-authoritative cart/checkout request validation.
2. Add Order and Payment models/state machines.
3. Add payment-provider interface.
4. Implement AutoGoPay adapter after re-validating current provider documentation.
5. Generate QRIS server-side.
6. Render QRIS inside Flutter.
7. Implement check status.
8. Implement authenticated/idempotent webhook handling.
9. Implement pending payment cancellation and expiry.
10. Reconcile app state after background/resume or missed realtime events.

## Validation Evidence

Latest full CI validation:
- Customer format: PASS
- Customer analyze: PASS
- Customer tests: PASS
- Android debug APK: PASS
- API lint: PASS
- API unit: PASS
- API e2e: PASS
- API build: PASS
- Repository policy: PASS
