# Documentation Index

Start with:
1. [Project State](./PROJECT_STATE.md)
2. [Product](./PRODUCT.md)
3. [Architecture](./ARCHITECTURE.md)
4. [Design System](./DESIGN_SYSTEM.md)
5. [Engineering Standards](./ENGINEERING_STANDARDS.md)
6. [Roadmap](./ROADMAP.md)

## Product Domains

- [Menu and Modifiers](./product/MENU_AND_MODIFIERS.md)
- [Pickup](./product/PICKUP.md)
- [Delivery](./product/DELIVERY.md)
- [Loyalty and Membership](./product/LOYALTY_AND_MEMBERSHIP.md)
- [Inventory](./product/INVENTORY.md)
- [Digital Benefits](./product/DIGITAL_BENEFITS.md)

## Integrations

- [Payments](./integrations/PAYMENTS.md)
- [AutoGoPay](./integrations/AUTOGOPAY.md)
- [Maps and Location](./integrations/MAPS.md)

## Android

- [Android Requirements](./android/ANDROID_REQUIREMENTS.md)
- [Permission Policy](./android/PERMISSIONS.md)
- [Signing](./android/SIGNING.md)
- [Google Play Checklist](./android/PLAY_STORE_CHECKLIST.md)

## iOS

- [iOS Requirements](./ios/IOS_REQUIREMENTS.md)

## Brand and UI

- [Brand Guidelines](./brand/BRAND_GUIDELINES.md)
- [Asset Guidelines](./brand/ASSET_GUIDELINES.md)

## Quality, Privacy, and Decisions

- [Testing](./TESTING.md)
- [Privacy Data Map](./PRIVACY_DATA_MAP.md)
- [Architecture Decision Records](./adr/README.md)

### Accepted ADRs

- [ADR 0001: Flutter](./adr/0001-use-flutter.md)
- [ADR 0002: NestJS + PostgreSQL](./adr/0002-use-nestjs.md)
- [ADR 0003: Payment Provider Abstraction](./adr/0003-payment-provider-abstraction.md)
- [ADR 0004: Android SDK Baseline](./adr/0004-android-sdk-baseline.md)
- [ADR 0005: No-Gradient Design Language](./adr/0005-no-gradient-design-language.md)

## Agent Instructions

The primary repository instruction file is [../AGENTS.md](../AGENTS.md).

Tool-specific adapters live under:
- `.cursor/rules/`
- `.claude/rules/`
- `.claude/skills/`
- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `GEMINI.md`

Do not treat tool-specific adapters as separate product truth. `AGENTS.md`, project docs, and ADRs are the source of truth.
