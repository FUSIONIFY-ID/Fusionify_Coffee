# ADR 0007: Lock Android Application ID

Date: 2026-09-06
Status: Accepted

## Context

Google Play treats an application's package identity as a durable release
identity. Fusionify Coffee previously used `id.fusionify.coffee` as a
provisional scaffold value, which was not safe to upload until explicitly
approved.

## Decision

Lock the Android namespace and application ID to:

```text
id.fusionify.coffee
```

The first Google Play upload must use this ID. Future releases must not rename
it or create a second listing without a separate product decision.

## Consequences

- Google Play App Signing, tester access, certificate fingerprints, deep links,
  and future Android integrations use this identity.
- Changing the public identity later requires a new Play listing and migration
  plan rather than an ordinary update.
- iOS bundle identity remains a separate release decision.

## Alternatives Considered

- `com.fusionify.coffee`
- Delaying the identity decision and building only non-Play preview artifacts
