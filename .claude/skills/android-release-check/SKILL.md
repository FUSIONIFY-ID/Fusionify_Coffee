---
name: android-release-check
description: Check Fusionify Coffee Android readiness before an internal, closed, open, or production Play release.
---

# Android Release Check

Verify the current implementation, not just documentation.

Check:
1. `minSdk = 28`
2. `compileSdk = 36`
3. `targetSdk = 36`
4. Release output is AAB where Play release is intended
5. Release signing uses an upload key and Play App Signing strategy
6. No keystore or `key.properties` is tracked
7. Requested permissions match documented product needs
8. No background location unless explicitly approved
9. No broad media permission where system Photo Picker is sufficient
10. Package/application ID is stable and documented
11. Data Safety impact is reviewed
12. Account deletion requirements are addressed when account creation exists
13. SDK/dependency compatibility and warnings are reviewed
14. Edge-to-edge and predictive-back behavior are tested
15. Relevant API 28 and API 36 tests are performed

Re-check current Google Play policy before a real release because platform requirements change over time.
