# ADR 0001: Use Flutter for the Customer Application

Date: 2026-08-28
Status: Accepted

## Context

Fusionify Coffee needs a consumer application for Android and iOS with shared product behavior and a consistent design system.

## Decision

Use Flutter + Dart for the customer application.

Use Riverpod for application state, GoRouter for navigation, and Dio for HTTP networking unless a future accepted ADR changes these choices.

## Consequences

Benefits:
- Shared Android/iOS feature code
- One primary UI implementation
- Consistent design tokens and component behavior

Constraints:
- Native Android/iOS configuration is still required for signing, notifications, permissions, maps, deep links, and store release.
- Flutter dependencies must be evaluated for both platforms.

## Alternatives Considered

- Separate Kotlin and Swift applications
- React Native

These are not selected for the initial product.
