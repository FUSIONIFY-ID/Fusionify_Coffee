# iOS Requirements

Fusionify Coffee customer app is a shared Flutter application for Android and iOS.

The exact iOS deployment target will be locked when the Flutter scaffold and dependency set are created.

## Principles

- Preserve iOS compatibility for customer features
- Use Keychain-backed secure storage for sensitive session material
- Use native permission descriptions that explain real user value
- Avoid requesting location before the user invokes a location feature
- Use Apple-supported photo picker behavior where practical
- Keep payment-provider private secrets server-side
- Do not assume Android-only navigation/interaction patterns

## Required Native Areas

Expect platform-specific configuration for:
- App icon
- Launch screen
- Push notifications/APNs
- Location permission descriptions
- Deep links/universal links when implemented
- Maps provider configuration
- Signing/provisioning
- App Store privacy declarations

## Development

A final native iOS build/sign/archive requires macOS and Xcode.

Most shared Flutter feature work can remain platform-neutral.

## Release

Before App Store submission, re-check current Apple requirements for:
- Supported SDK/Xcode
- Privacy manifests/declarations
- Account deletion
- Tracking/analytics
- Push notifications
- Location usage
- Sign in requirements if third-party social sign-in is introduced
