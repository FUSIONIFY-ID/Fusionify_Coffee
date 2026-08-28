# Android Signing

## Strategy

Use Google Play App Signing.

Fusionify controls an upload key.
Google Play protects and uses the app signing key for Play-distributed artifacts.

## Current Repository State

The Flutter scaffold currently has no production release signing configuration.

The generated debug-key release signing shortcut was removed intentionally so a release is not accidentally treated as production-ready.

Current generated Android application ID is `id.fusionify.coffee`, but it remains provisional until explicitly locked as the production package ID.

## Upload Key

Suggested naming convention:

- File: `fusionify-coffee-upload.jks`
- Alias: `fusionify_coffee_upload`

The actual key must be generated and stored securely outside Git.

Do not create or commit a fake key for repository completeness.

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

## Flutter Configuration Direction

When the production package ID and upload key are ready, release signing should load values from an untracked local configuration such as `key.properties` or protected CI secret storage.

Never hardcode signing passwords in Gradle source.

## Certificates

Keep track of distinct certificate fingerprints:

- Debug certificate
- Upload certificate
- Google Play app signing certificate

Production integrations such as Google APIs may require the Play app-signing certificate fingerprint rather than the upload certificate.

Do not assume they are interchangeable.

## Package ID

Application/package ID must be explicitly approved and stabilized before Play production registration/signing configuration is treated as final.

Do not register the provisional scaffold identity as final by accident.

## CI

Repository policy rejects:
- Tracked `.jks` / `.keystore`
- Tracked `android/key.properties`
- Release configuration that explicitly uses the debug signing key

If CI produces signed release artifacts in the future:
- Store signing material in protected CI secrets
- Reconstruct temporary keystore only for the job
- Prevent logs from printing secrets
- Delete temporary signing material after the job
