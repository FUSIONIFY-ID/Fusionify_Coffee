# Fusionify Coffee Customer App

Flutter customer application for Fusionify Coffee.

## Stack

- Flutter 3.47
- Material 3
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- Android API 28+ with compile/target API 36
- iOS generated from the shared Flutter project and subject to final platform review

## Current Scope

Milestone 0.1 includes:
- Material 3 seed-based Fusionify theme
- Edge-to-edge UI
- Adaptive `NavigationBar` / `NavigationRail`
- API-backed development catalog
- Loading, error, retry, and refresh states
- Outlet/menu/category discovery
- Product modifier selection
- Size, temperature, sugar, ice, milk, and add-ons
- Cart with distinct configuration identity
- Quantity and subtotal behavior

Checkout, real payment, authentication, rewards, delivery, database-backed production catalog, and production assets are not implemented yet.

## API Configuration

The customer app reads:

```text
--dart-define=API_BASE_URL=https://your-api.example
```

If it is omitted during development:
- Android emulator uses `http://10.0.2.2:3000`
- Other local mobile development uses `http://127.0.0.1:3000`

Android cleartext HTTP is allowed only in the debug manifest for local development.

Production API traffic should use HTTPS.

Example:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

## Development

Run the API first, then:

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

The API preview catalog is explicitly development data. Do not present it as production business data.

## Android

Current generated application ID is `id.fusionify.coffee`, but it remains provisional until the project explicitly locks the production package ID.

Release signing with the real upload keystore is not configured in Git and must follow `../../docs/android/SIGNING.md`.

## Repository Rules

Read the root `AGENTS.md` and `docs/PROJECT_STATE.md` before material changes.

No gradients. No AI slop. No fake functionality.
