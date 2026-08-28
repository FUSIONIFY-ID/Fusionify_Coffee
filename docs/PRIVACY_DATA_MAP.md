# Privacy Data Map

This file describes planned data categories. Actual Play/App Store declarations must reflect the implementation and SDK behavior at release time.

## Planned Customer Data

Potential categories:
- Name
- Email
- Phone number if enabled
- Account identifiers
- Saved delivery addresses
- Approximate location
- Precise location only when user intentionally uses location-based features
- Order history
- Purchase/payment status
- Favorites
- Rewards and membership state
- Device push token
- Crash/diagnostic information if crash reporting is enabled

## Principles

- Collect only what the feature needs.
- Do not use background location for the customer app without a future approved requirement.
- Prefer system pickers over broad media-library access.
- Payment secrets remain server-side.
- Do not store raw sensitive payment credentials that the payment architecture does not require.
- Retention and deletion behavior must be documented before production.

## Account Deletion

Because the product plans user accounts, account deletion must be designed as a real product/backend capability before production distribution where platform policy requires it.

## SDK Review

Every analytics, maps, notification, crash, authentication, or other third-party SDK can affect privacy declarations.

Review actual SDK data behavior before release rather than copying a template Data Safety answer.
