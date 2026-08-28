# Changelog

All notable project changes are documented by meaningful product and engineering milestones rather than generated commit noise.

## Unreleased

### Added

- Repository foundation and documentation index
- Primary AGENTS.md repository instruction policy
- Cursor, Claude, Gemini, and Copilot agent guidance
- Claude project skills
- Contribution, security, issue, and pull-request policies
- Product, architecture, design-system, engineering, testing, and privacy documentation
- Android API 28/36, permission, Play, and signing policy
- iOS platform direction
- AutoGoPay/payment and maps integration planning
- Initial architecture decision records
- Flutter 3.47 Android/iOS customer application scaffold
- Riverpod, GoRouter, and Dio customer stack
- Full Material 3 component/theme foundation
- Edge-to-edge system UI
- Adaptive NavigationBar / NavigationRail
- Fusionify Coffee solid-color design tokens
- API base URL configuration via dart-define
- Dio catalog repository and Riverpod async provider
- Loading, retry, error, and refresh catalog states
- API-backed preview outlet, menu, category, product customization, and cart flow
- Size, temperature, sugar, ice, milk, and add-on modifiers
- Modifier-aware cart identity and subtotal behavior
- NestJS 11 + Node 24 API scaffold
- Prisma/PostgreSQL catalog schema foundation
- Modifier-aware preview catalog endpoint
- Flutter catalog parsing test
- Flutter widget and cart tests
- API unit and e2e tests
- Android debug APK compile validation in CI
- CI for Flutter format/analyze/test/APK and API lint/unit/e2e/build
- Repository policy CI including no-gradient enforcement and signing/secret-file checks

### Changed

- Runtime catalog now comes from the NestJS API instead of a local Flutter fixture
- Removed obsolete local runtime catalog fixture
- Product detail resolves products from async API catalog state
- Phone navigation remains Material 3 NavigationBar while wide layouts use NavigationRail
- Removed Flutter/Nest generic project README content
- Android release no longer uses the debug signing key
- iOS display name corrected to Fusionify Coffee

### Fixed

- Corrected Flutter router model import and dynamic preview outlet const usage discovered by CI
- Bootstrap workflow now installs API dependencies before backend validation
- Removed strict-analyzer unused router import
