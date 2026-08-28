# Android Requirements

Last reviewed for project planning: 2026-08-28.

Platform policies change. Re-check official Android and Google Play requirements before every production release.

## SDK Baseline

Fusionify Coffee Android baseline:

- `minSdk = 28`
- `compileSdk = 36`
- `targetSdk = 36`
- Do not set `maxSdk`

Meaning:
- API 28 is the minimum installable Android version.
- API 36 is the compile and behavior target baseline for the initial project.
- Future target/compile SDK increases should be planned without unnecessarily raising minSdk.

## Release

Google Play release direction:
- Android App Bundle (`.aab`)
- Play App Signing
- Fusionify-managed upload key
- Stable application/package ID
- Release signing configuration excluded from Git

## UI Compatibility

Target modern Android behavior from the beginning:
- Edge-to-edge safe layouts
- Gesture navigation
- Predictive back behavior
- Status/navigation bar insets
- Keyboard/inset handling
- Small and large phone layouts
- Tablet/foldable must not break even if phone remains primary

## Permissions

Follow `PERMISSIONS.md`.

Principle:
Request only the capability required for an intentional user action.

## SDK/Dependency Review

Before adding a native SDK or Flutter plugin:
- Check active maintenance
- Check API 28 and API 36 compatibility
- Review transitive Android permissions
- Review Play SDK warnings when available
- Review privacy/Data Safety impact
- Avoid outdated dependencies merely because an old tutorial uses them

## Quality

Before production:
- Test API 28 baseline
- Test API 36 behavior
- Test at least one realistic mid-range Android configuration
- Review crashes and ANRs
- Validate notification flows
- Validate location denial/retry
- Validate payment flow under app background/resume and network loss

## Policy Readiness

Production release requires review of:
- Developer/package verification
- Target API requirements
- Data Safety
- Privacy policy
- Account deletion when accounts are available
- Content rating
- Ads declaration
- Sensitive permission declarations if any
- SDK policy warnings

Documentation is not evidence that Play Console checks passed. Record actual release validation separately.
