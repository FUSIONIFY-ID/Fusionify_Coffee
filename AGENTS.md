# AGENTS.md

This file is the primary repository instruction source for AI coding agents and human contributors working on Fusionify Coffee.

## Read First

Before changing code or documentation:

1. Read this file.
2. Read `docs/PROJECT_STATE.md`.
3. Read the relevant product or architecture documentation for the area being changed.
4. Inspect the existing implementation before proposing a rewrite.
5. Read applicable ADRs in `docs/adr/`.

## Product Intent

Fusionify Coffee is a consumer coffee ordering application and coffee-shop operations platform. The customer experience should feel as polished and efficient as major coffee-chain applications without copying another brand's design, copy, assets, or proprietary implementation.

Primary customer flows include menu discovery, product customization, pickup, delivery, QRIS payment, order tracking, rewards, points, membership, favorites, and digital benefits.

Operations include POS, KDS, inventory, recipes, waste, stock opname, transfers, suppliers, purchasing, assets, and maintenance.

## Non-Negotiable Rules

### No AI Slop

Do not add code, screens, abstractions, copy, files, metrics, or visual elements merely to make work appear complete.

Prohibited examples:
- Fake production metrics or fabricated business data
- Nonfunctional buttons presented as working
- Placeholder screens represented as completed features
- Generic AI marketing copy
- Unnecessary wrappers, services, repositories, or abstractions
- Duplicate helpers and models
- Unrequested redesigns
- Comments that only restate obvious code
- Silent error swallowing
- Random TODOs without context

### No Vibe Coding

Every implementation must have:
- A clear product or technical reason
- Defined acceptance criteria
- The smallest correct scope
- Relevant validation
- A reviewed diff
- Updated documentation when behavior or architecture changes

Never report PASS for a check that was not run. Use NOT RUN with a reason.

### No AI-Style Overengineering

Prefer simple, explicit, maintainable code. Do not introduce architecture because it looks sophisticated.

Avoid:
- Generic `ManagerServiceHelper`-style abstractions
- Interfaces with no present architectural purpose
- Giant widgets, controllers, or services
- Magic values
- Broad catch blocks that hide failures
- Premature cross-feature abstractions

### No Gradients

Gradients are prohibited in product UI unless this rule is explicitly changed through an accepted ADR and design-system update.

Do not use:
- LinearGradient
- RadialGradient
- SweepGradient
- CSS linear-gradient
- CSS radial-gradient
- Gradient image overlays used as decorative substitutes for hierarchy

Use solid colors, typography, spacing, imagery, borders, restrained elevation, and motion.

### Preserve Brand Integrity

- Do not invent or redesign an official logo.
- Do not recolor official brand assets unless the brand documentation explicitly permits it.
- Do not copy assets from Fore Coffee, Kopi Kenangan, Starbucks, or other brands.
- Product photography and campaigns are dynamic content and should not be hardcoded into the app.

## Engineering Baseline

Customer application:
- Flutter + Dart
- Riverpod
- GoRouter
- Dio
- Android and iOS from one codebase

Backend:
- NestJS + TypeScript
- PostgreSQL + Prisma

Android:
- minSdk 28
- compileSdk 36
- targetSdk 36
- Android App Bundle for Play release
- Play App Signing
- Minimum necessary permissions

Payment:
- Provider API secrets must remain server-side.
- AutoGoPay is a temporary provider behind a provider adapter.
- Mobile clients communicate with the Fusionify backend, not payment-provider private APIs.
- Webhooks must be authenticated, idempotent, and reconciled against local order/payment state.

## UI/UX Direction

The interface is a premium consumer coffee app, not a SaaS dashboard.

Priorities:
1. Fast ordering
2. Clear pickup/delivery choice
3. Strong product photography
4. Straightforward customization
5. Visible rewards and points
6. Clear order/payment states
7. Accessible, responsive layouts
8. Minimal user friction

Avoid:
- Dashboard-looking home screens
- Excessive promotional popups
- Excessive shadows
- Every component being a rounded card
- Blue used on every surface
- Emoji as production iconography
- Arbitrary spacing/radius/color values
- Tech jargon shown to customers

## Source of Truth

Use:
- `docs/PROJECT_STATE.md` for current implementation state
- `docs/PRODUCT.md` for product scope
- `docs/ARCHITECTURE.md` for architecture
- `docs/DESIGN_SYSTEM.md` for UI rules
- `docs/ENGINEERING_STANDARDS.md` for engineering rules
- `docs/ROADMAP.md` for sequencing
- `docs/adr/` for durable architecture decisions

If documents conflict, prefer the most recent accepted ADR for architecture and `PROJECT_STATE.md` for implementation status. Do not silently resolve material conflicts. Update the docs.

## Required Workflow

Before implementation:
- Inspect current state
- Identify affected modules
- State acceptance criteria internally or in the issue/PR
- Check whether an ADR is required

During implementation:
- Keep scope narrow
- Preserve existing behavior unless the task requires a change
- Use design tokens
- Avoid secrets and hardcoded provider credentials
- Add tests for meaningful business logic

Before completion:
- Format relevant code
- Run relevant static analysis
- Run relevant tests
- Review the diff for unintended changes
- Confirm no secret or keystore is tracked
- Update relevant docs
- Update `docs/PROJECT_STATE.md` if project state changed

## Documentation Policy

Documentation follows reality, not aspiration.

Do not mark future features as implemented.
Do not create empty documentation files to look complete.
When a decision changes architecture, add or update an ADR.
When a milestone changes, update `PROJECT_STATE.md`.

## Security

Never commit:
- `.env` files
- API keys
- payment secrets
- database passwords
- service-account keys
- `*.jks` or `*.keystore`
- `android/key.properties`
- signing passwords
- production tokens

If a secret is found in Git history, treat it as compromised and rotate it.

## Definition of Done

A change is done only when:
- Requested behavior is implemented
- Relevant error/loading/empty states exist when applicable
- Relevant tests/checks pass or are clearly reported as not run
- No new known secret exposure exists
- Documentation matches behavior
- No prohibited design patterns were introduced
