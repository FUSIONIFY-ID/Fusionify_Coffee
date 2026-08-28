# Project State

Last updated: 2026-08-28

## Repository

- Repository: `FUSIONIFY-ID/Fusionify_Coffee`
- Default branch: `main`
- Visibility: public

## Current Milestone

Foundation / pre-Milestone 0.1.

The repository is being initialized with product, engineering, design, platform, security, payment, and agent-memory rules before application scaffolding begins.

## Completed

- Repository created
- Repository write access verified
- README initialized
- Primary `AGENTS.md` policy added
- Claude, Gemini, Copilot, and Cursor repository guidance added
- Claude project skills added
- Contribution and security policies added
- Issue and pull-request templates added
- Secret/keystore ignore policy added
- Product direction documented
- Architecture direction documented
- Design-system direction documented
- Engineering standards documented

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

## Not Implemented Yet

No production application code has been scaffolded yet.

Not implemented:
- Flutter customer application
- Backend API
- Authentication
- Outlet discovery
- Menu
- Product modifiers
- Cart
- Pickup
- Delivery
- AutoGoPay integration
- Payment webhook
- Order tracking
- Rewards
- Membership
- POS
- KDS
- Inventory
- Procurement
- Assets/maintenance
- Wi-Fi benefit
- AI benefit

## Next Milestone: 0.1

Goal:

A customer can open the app, select/view an outlet, browse real structured menu data, customize a product, and add distinct configurations to cart.

Planned sequence:
1. Scaffold Flutter customer app for Android and iOS.
2. Apply Android API 28/36 baseline.
3. Establish package/application ID before release signing.
4. Create design tokens and app shell.
5. Add navigation.
6. Establish backend scaffold.
7. Model outlets, categories, products, modifier groups/options.
8. Implement menu and product detail.
9. Implement cart.
10. Add validation and tests.

## Milestone 0.2

Pickup checkout and AutoGoPay QRIS:
- Create order
- Create QRIS payment server-side
- Native in-app payment screen
- Check payment status
- Automatic webhook detection
- Pending payment cancellation
- Expiry handling
- Reconciliation

## Milestone 0.3

Fulfillment and rewards:
- Confirmed
- Preparing
- Ready
- Picked up
- Completed
- Fusion Points ledger and crediting

## Validation State

Application tests: NOT RUN, application code does not exist yet.
Static analysis: NOT RUN, application code does not exist yet.
Android release validation: NOT RUN, Android project does not exist yet.
