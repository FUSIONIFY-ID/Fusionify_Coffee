# Fusionify Coffee

Fusionify Coffee is a cross-platform coffee ordering and operations platform for Android and iOS.

The product direction is inspired by the usability level of major coffee-chain applications while keeping an original Fusionify identity, interaction model, and engineering architecture. It must not copy another brand's UI, copywriting, assets, or proprietary interaction patterns.

## Product Scope

### Customer Experience

- Outlet discovery
- Pickup and delivery
- Dynamic menu and modifiers
- Size, temperature, sugar, ice, milk, toppings, and add-ons
- Cart and checkout
- In-app QRIS payment
- Automatic payment detection and status reconciliation
- Order tracking
- Fusion Points, rewards, vouchers, and membership
- Favorites and reorder
- Digital receipt
- Future Wi-Fi and AI benefits

### Operations

- POS
- KDS
- Inventory and recipes
- Stock movement, waste, stock opname, and transfers
- Procurement and suppliers
- Asset and maintenance management

## Core Stack

- Customer app: Flutter + Dart
- State management: Riverpod
- Routing: GoRouter
- Networking: Dio
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Temporary payment provider: AutoGoPay through a backend payment-provider adapter

## Android Baseline

- minSdk: 28
- compileSdk: 36
- targetSdk: 36
- Release format: Android App Bundle
- Play App Signing: required
- Background location: prohibited unless a future approved product requirement exists
- Broad photo/media access: prohibited unless a future approved product requirement exists

## Automated Distribution

### GitHub Packages

The NestJS API is published to GitHub Container Registry after `CI` succeeds on `main`.

```text
ghcr.io/FUSIONIFY-ID/fusionify-coffee-api:latest
ghcr.io/FUSIONIFY-ID/fusionify-coffee-api:sha-<commit>
```

Package publication is handled by `.github/workflows/package-api.yml` and uses the repository `GITHUB_TOKEN`.

### GitHub Releases

Pushing an explicit `v*` tag, for example:

```text
v0.3.0-preview.1
```

runs `.github/workflows/release-preview.yml`. The workflow validates the Flutter app, builds a debug-signed preview APK, creates a GitHub **prerelease**, and attaches the APK.

Preview releases are intentionally not presented as production Google Play builds. Production release signing remains a separate future step.

## Non-Negotiable Engineering Rules

- No AI slop
- No vibe coding
- No AI-style overengineering
- No gradients
- No fake functionality or fake production data
- No secrets, API keys, keystores, or credentials in Git
- No payment-provider secrets in the mobile application
- No arbitrary design values outside the design system
- No architecture rewrite without documented justification
- No claim of completion without validation evidence

Read [AGENTS.md](./AGENTS.md) before making changes.

## Current State

The latest implementation state, decisions, and next steps live in [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md).

## Repository Structure

This repository will grow into a monorepo containing:

- `apps/customer` for the Flutter customer application
- `apps/admin` for the operations dashboard
- `apps/pos` for point of sale
- `apps/kds` for kitchen display
- `services/api` for the NestJS API
- `docs` for product, architecture, engineering, platform, and operational documentation

Only create application folders when implementation starts. Empty enterprise-looking folders are not useful.

## License

Copyright © FUSIONIFY-ID. All rights reserved unless a separate license is added later.
