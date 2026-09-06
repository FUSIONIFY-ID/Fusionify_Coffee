# Android Signing

## Strategy

Use Google Play App Signing.

Fusionify controls an upload key.
Google Play protects and uses the app signing key for Play-distributed artifacts.

## Current Repository State

Release signing is configured to read the upload keystore and credentials only
from process environment variables. Any release task fails when these values
are missing or the keystore path is invalid.

Required variables:

- `FUSIONIFY_UPLOAD_STORE_FILE`
- `FUSIONIFY_UPLOAD_STORE_PASSWORD`
- `FUSIONIFY_UPLOAD_KEY_ALIAS`
- `FUSIONIFY_UPLOAD_KEY_PASSWORD`

Debug signing is never used as a release fallback.

## Upload Key

Suggested naming convention:

- File: `fusionify-coffee-upload.jks`
- Alias: `fusionify_coffee_upload`

The actual key must be generated and stored securely outside Git.

CI creates a disposable key only to prove the release build path. That AAB is
not published or reused. Real internal and production artifacts require the
Fusionify-managed upload key reconstructed from protected GitHub secrets.

## Never Commit

- `*.jks`
- `*.keystore`
- `android/key.properties`
- Store password
- Key password
- Private signing material

These patterns are included in repository ignore/security policy.

## Backup

Back up:
- Upload keystore file
- Alias
- Store password
- Key password

Use protected, independent storage. Do not keep the only copy on a development laptop.

## Local Release Build

Export the four signing variables without writing passwords into a tracked
file, then run:

```bash
flutter build appbundle --release \
  --build-name=0.1.0 \
  --build-number=1 \
  --dart-define=API_BASE_URL=https://your-real-api.example
```

The API URL must be HTTPS and cannot be localhost. Never hardcode signing
passwords in Gradle source or command history.

## Certificates

Keep track of distinct certificate fingerprints:

- Debug certificate
- Upload certificate
- Google Play app signing certificate

Production integrations such as Google APIs may require the Play app-signing certificate fingerprint rather than the upload certificate.

Do not assume they are interchangeable.

## Package ID

The approved Android application ID is:

```text
id.fusionify.coffee
```

See ADR 0007. Do not change it after the first Play upload.

## CI

Repository policy rejects:
- Tracked `.jks` / `.keystore`
- Tracked `android/key.properties`
- Release configuration that explicitly uses the debug signing key

The `Build Play Internal AAB` workflow uses protected CI secrets, reconstructs
the upload keystore under the runner's temporary directory, verifies the
signature, publishes the AAB as a short-lived workflow artifact, and removes
the temporary keystore.

See `PLAY_INTERNAL_TESTING.md` for setup and handoff steps.
