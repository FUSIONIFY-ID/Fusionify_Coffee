# Fusionify Coffee Customer App

Flutter customer application for Android and iOS.

## Stack

- Flutter 3.47
- Material 3
- Riverpod 3.4.2
- GoRouter 18
- Dio 5.11
- qr_flutter 4.1.0
- Android minSdk 28
- Android compileSdk/targetSdk 36

## Current Customer Flow

Implemented development flow:

```text
Home
 -> Menu
 -> Product customization
 -> Cart
 -> Checkout
 -> server-authoritative Order
 -> GoPay QRIS Payment
 -> native QR display
 -> payment status/reconciliation
```

## Material 3

- Fusionify seed-based ColorScheme
- edge-to-edge
- NavigationBar on phones
- NavigationRail on wide layouts
- Material cards/buttons/chips/sheets/snackbars
- no gradients
- no dynamic recoloring that overrides Fusionify brand

## Account Lifecycle

Implemented customer account features:
- Indonesia (+62) and Malaysia (+60) phone identity
- WhatsApp/SMS OTP abstraction
- password login
- automatic access-token refresh with refresh-token rotation
- forgot/reset password by OTP code
- change verified phone number by OTP
- active device/session list
- revoke session / log out all devices
- account deletion with OTP verification and identity anonymization
- authenticated order history

## Checkout

Cart subtotal is an estimate for display.

Checkout sends:
- outlet ID
- product IDs
- modifier IDs
- quantities
- optional customer voucher wallet ID

The backend calculates the final amount and validates voucher eligibility again. The customer app does not calculate an authoritative discount.

If an eligible voucher reduces the server-authoritative total to zero and the backend confirms the order, Flutter skips payment creation and opens the persisted order instead.

## QRIS Payment

Flutter does not contain an AutoGoPay API key and does not call AutoGoPay directly.

The payment screen:
- renders backend `qrString` using qr_flutter
- polls local Fusionify payment state
- provides Check Status through Fusionify API
- provides pending Cancel through Fusionify API
- reconciles pending state on app resume
- clears cart only after PAID

Live AutoGoPay transactions are not yet validated.

## API Configuration

```text
--dart-define=API_BASE_URL=https://your-api.example
```

Development defaults:
- Android emulator: `http://10.0.2.2:3000`
- other local mobile development: `http://127.0.0.1:3000`

Android cleartext HTTP is debug-only.
Production API traffic must use HTTPS.

## Development

Run the API first:

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

Example:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com
```

## Android

Generated application ID remains provisional:

```text
id.fusionify.coffee
```

Production release signing is intentionally not configured in Git.

See `../../docs/android/SIGNING.md`.

## Repository Rules

Read:
- `../../AGENTS.md`
- `../../docs/PROJECT_STATE.md`

No gradients. No AI slop. No fake functionality.

## Order Detail + Fulfillment Timeline

The authenticated Orders tab now opens a dedicated order-detail route.

Implemented customer behavior:
- order item breakdown
- total amount
- current order status
- persisted fulfillment timeline from backend status events
- pull-to-refresh reconciliation
- localized status labels for Indonesian, Malay, and English

Fulfillment status events are authoritative backend data. The customer app does not synthesize fake progress from timestamps.

## Digital Receipt

Authenticated customers can open a server-backed digital receipt from order detail.

The receipt renders:
- outlet and order identity
- persisted item/modifier snapshots
- subtotal, discount, delivery fee, and total
- payment summary when available
- voucher code when available
- issued digital-benefit references when available

Receipt data comes from the backend order record. The Flutter app does not reconstruct an authoritative receipt from local cart state.

## Rewards + Digital Benefits UI

Rewards is a customer hub for:
- Fusion Points / membership
- customer voucher wallet
- digital benefits from eligible completed orders

Voucher wallet and digital-benefit data come from authenticated backend APIs. Wi-Fi passwords are masked by default in the customer UI, and AI benefits display backend quota state.
