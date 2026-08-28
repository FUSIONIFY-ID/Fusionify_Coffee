# Project State

Last updated: 2026-08-28

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public

## Current Milestone

Milestone 0.1 ordering foundation is implemented as a development preview.

The app and API are scaffolded and validated. The customer app currently uses explicitly labeled local preview catalog data. Flutter is not yet wired to the backend preview endpoint or PostgreSQL.

## Completed

### Repository Foundation
- Repository rules and `AGENTS.md`
- Claude, Gemini, Copilot, and Cursor guidance
- Project skills and project-memory workflow
- Security/contribution templates
- No-gradient and signing/secret repository policy

### Customer App
- Flutter 3.47 Android+iOS scaffold
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- Android minSdk 28, compileSdk 36, targetSdk 36
- Material 3 app shell
- Solid-color Fusionify design tokens
- Bottom navigation
- Preview outlet context
- Menu/category browsing
- Product detail
- Dynamic development modifier groups for size, temperature, sugar, ice, milk, and add-ons
- Modifier-aware price calculation
- Cart item identity by product configuration
- Quantity increment/decrement/remove
- Cart subtotal
- Honest disabled states for checkout/delivery/rewards/auth not implemented yet
- Flutter widget test
- Cart controller unit test

### Backend
- Node.js 24 toolchain
- NestJS 11 scaffold
- Prisma 7 + PostgreSQL schema foundation
- `GET /v1/health`
- `GET /v1/catalog/preview`
- Preview catalog tests
- Initial Outlet, Category, Product, ModifierGroup, ModifierOption schema

### CI
- Flutter format check
- Flutter analyze
- Flutter tests
- API lint
- API unit tests
- API e2e tests
- API build
- Repository policy checks

## Accepted Decisions

- Customer app: Flutter + Dart
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
- Maps provider
- Delivery/courier provider
- Membership tier thresholds and benefits
- Fusion Points earning/redemption rates
- Refund provider/process

Do not turn these into final decisions without explicit project approval.

## Development Preview Data

Current local Flutter catalog and `/v1/catalog/preview` data are intentionally fictional development fixtures.

They are not production outlet, menu, pricing, popularity, or operational data.

## Not Implemented Yet

- Flutter-to-API catalog wiring
- PostgreSQL persistence/migrations for live catalog
- Authentication
- Real outlet discovery
- Real product photography/assets
- Pickup checkout
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

Complete Milestone 0.1 as a real data boundary:
1. Add app configuration for API base URL.
2. Add Dio API client and catalog repository.
3. Expand preview API to return modifier groups/options.
4. Wire Flutter catalog state to the backend with explicit loading/error/retry states.
5. Add database service and initial migration when a PostgreSQL environment is defined.
6. Replace preview imagery only after official assets/product media are available.
7. Lock Android production package ID before generating the upload keystore.

After that, begin Milestone 0.2:
- Pickup checkout
- Server-calculated order
- AutoGoPay QRIS
- Automatic payment detection
- Pending payment cancellation
- Expiry/reconciliation

## Validation Evidence

Bootstrap validation after implementation:
- Dart format: PASS
- Flutter analyze: PASS, no issues found
- Flutter tests: PASS, 2 tests
- API dependencies install: PASS
- API lint: PASS
- API unit tests: PASS
- API build: PASS

Repository policy:
- Signing file check: PASS
- Secret-like environment file check: PASS
- No-gradient UI check: PASS

API e2e validation is added to regular CI in the cleanup commit and must pass before this state is treated as fully green.
