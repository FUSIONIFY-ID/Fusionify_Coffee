# AutoGoPay Integration

Status: planned, not implemented.

Provider documentation reference:
- https://autogopay.site/docs

Provider behavior must be re-validated against current documentation immediately before implementation.

## Role

AutoGoPay is the initial temporary QRIS payment provider.

It must remain behind the Fusionify payment-provider abstraction so a later provider can be introduced without rewriting customer application business logic.

## Planned Flow

```text
Customer checkout
    |
    v
Fusionify API creates local order/payment
    |
    v
Fusionify API requests QRIS from AutoGoPay
    |
    v
Fusionify API returns safe QR/payment data to Flutter
    |
    v
Flutter displays native Fusionify Coffee payment UI
    |
    +---- Check status through Fusionify API
    +---- Cancel pending payment through Fusionify API
    |
Customer pays
    |
    v
AutoGoPay webhook / provider detection
    |
    v
Fusionify API verifies + idempotently settles local payment
    |
    v
Order CONFIRMED + app/POS/KDS update
```

## Documented Provider Capabilities to Validate

Current planning assumes provider documentation exposes QRIS operations equivalent to:
- Generate QRIS
- Check QRIS status
- Cancel pending QRIS
- Webhook/callback on payment detection

Earlier documentation review identified endpoint naming such as:
- `/qris/generate`
- `/qris/status`
- `/qris/cancel`

Do not implement from this planning file alone. Confirm current request/response schemas and authentication directly from provider documentation.

## Status Mapping Direction

Planning mapping:

- provider pending -> PENDING
- provider settlement/paid -> PAID
- provider expire -> EXPIRED
- provider cancel -> CANCELLED

Store raw provider state separately when useful.

## Webhook Security

Earlier provider-documentation review indicated an `X-Signature` HMAC-SHA256 verification model using provider credential material.

Before coding:
- Confirm exact canonical payload/signing input
- Confirm encoding
- Confirm signature comparison requirements
- Use constant-time comparison when applicable
- Do not print secrets/signatures into normal application logs

## Idempotency

Use provider transaction ID and local payment/order identifiers to ensure duplicate callbacks cannot:
- Credit Fusion Points twice
- Confirm the same order twice
- Reduce inventory twice
- Emit duplicate fulfillment events

## In-App QRIS

Prefer rendering QR data returned by the backend in a native Fusionify Coffee screen where provider terms and technical response permit.

Do not put AutoGoPay private credentials in Flutter.

## Expiry and Backgrounding

The payment UI must survive:
- App background/resume
- Realtime disconnect
- Network reconnect
- Payment expiry

On resume, retrieve authoritative local state and reconcile when required.
