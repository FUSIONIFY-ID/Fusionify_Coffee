# Google Play Internal Testing

This runbook prepares an AAB for the Google Play Internal Testing track. It
does not grant Play Console access or claim that a Console upload passed.

Official references:

- [Set up an internal test](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348)
- [Sign an Android app](https://developer.android.com/studio/publish/app-signing)

## Locked Identity

```text
Application ID: id.fusionify.coffee
Minimum SDK: 28
Compile/target SDK: 36
Release format: Android App Bundle
```

Do not change the application ID after the first Play upload.

## Prerequisites

1. A verified Google Play developer account with permission to release apps to
   testing tracks.
2. A Fusionify-controlled upload key backed up in protected independent
   storage.
3. A reachable Fusionify API HTTPS URL for testers.
4. A new positive build number that has never been uploaded to this Play app.

The repository cannot provide items 1 through 3. Do not put an API key,
keystore, password, or Play service-account credential in Git or chat.

## Create the Upload Key Once

Run this on a trusted Fusionify-controlled device. The command prompts for the
passwords rather than placing them in shell history.

```bash
keytool -genkeypair -v \
  -keystore fusionify-coffee-upload.jks \
  -alias fusionify_coffee_upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Back up the keystore, alias, store password, and key password separately. Never
commit the keystore.

## Configure GitHub Secrets

Required repository or protected-environment secrets:

```text
ANDROID_UPLOAD_KEYSTORE_BASE64
ANDROID_UPLOAD_STORE_PASSWORD
ANDROID_UPLOAD_KEY_ALIAS
ANDROID_UPLOAD_KEY_PASSWORD
```

PowerShell can send the keystore directly to GitHub CLI without printing its
contents:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("C:\secure\fusionify-coffee-upload.jks")
) | gh secret set ANDROID_UPLOAD_KEYSTORE_BASE64

gh secret set ANDROID_UPLOAD_STORE_PASSWORD
gh secret set ANDROID_UPLOAD_KEY_ALIAS
gh secret set ANDROID_UPLOAD_KEY_PASSWORD
```

The last three commands prompt for their values.

## Build the Internal AAB

From GitHub Actions, select `Build Play Internal AAB` and choose `Run workflow`
on `main`.

Provide:

- `api_base_url`: real HTTPS API URL, without query string or credentials
- `build_name`: semantic version such as `0.1.0`
- `build_number`: unused positive Play version code
- `release_notes`: honest tester-facing changes

The workflow:

1. validates formatting, analysis, and Flutter tests;
2. verifies release inputs and the protected upload key;
3. builds a release AAB with cleartext traffic disabled;
4. verifies the AAB signature;
5. produces the AAB, SHA-256 checksum, and release notes as a 14-day artifact;
6. removes the temporary upload keystore.

## Upload to Play Console

1. Create/select Fusionify Coffee in Play Console.
2. Confirm Play App Signing enrollment.
3. Open **Test and release > Testing > Internal testing**.
4. Create a release and upload the workflow AAB.
5. Confirm Play reports `id.fusionify.coffee` and the intended version code.
6. Add an internal tester email list, save, review, and start rollout.
7. Open the opt-in link from an allowed tester account and install from Google
   Play.
8. Review the automated pre-launch report and record any crash, ANR,
   accessibility, or compatibility finding.

Internal testing supports up to 100 selected testers. An app exclusively active
on the internal track is currently exempt from the Data Safety form, but this
exemption does not apply when progressing toward broader tracks or production.

## Evidence to Record

Do not mark a line as passed without direct evidence.

```text
Play app ID:
Version name/code:
AAB SHA-256:
Workflow run URL:
Play upload accepted: PASS / NOT RUN
Internal rollout active: PASS / NOT RUN
Tester Play install: PASS / NOT RUN
Pre-launch report: PASS / FINDINGS / NOT RUN
API 28 device smoke test: PASS / NOT RUN
API 36 device smoke test: PASS / NOT RUN
```

## Current External Blockers

- The production/staging API hostname is not configured in the repository.
- Real WhatsApp/SMS OTP delivery is not validated.
- Real AutoGoPay transactions and callbacks are not validated.
- Official production icon/media approval is still pending.

These do not prevent an AAB file from being accepted by the internal track, but
they limit meaningful end-to-end tester coverage. Do not promote the app to
closed or production tracks until the relevant customer journeys work against
real controlled services.
