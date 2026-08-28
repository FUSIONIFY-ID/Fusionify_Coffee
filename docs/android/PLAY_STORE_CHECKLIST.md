# Google Play Release Checklist

This is a project checklist, not a substitute for current Play Console requirements.

Re-check official policy before release.

## Identity and Package

- [ ] Developer identity/account requirements satisfied
- [ ] Stable application/package ID
- [ ] Package registered/recognized correctly
- [ ] Play App Signing enabled
- [ ] Upload key safely configured

## Build

- [ ] minSdk 28
- [ ] compileSdk at current approved project baseline or newer required baseline
- [ ] targetSdk meets current Play requirement
- [ ] Release AAB builds successfully
- [ ] Release build signed with upload key
- [ ] No debug configuration in release
- [ ] Edge-to-edge reviewed
- [ ] Predictive back reviewed

## Permissions

- [ ] Manifest permission list audited
- [ ] Runtime permission UX tested
- [ ] No background location unless explicitly approved
- [ ] No broad media permission where system picker is enough
- [ ] No unnecessary camera/contacts/SMS/call-log permission

## Privacy

- [ ] Public privacy policy
- [ ] Data Safety matches actual code and SDKs
- [ ] Account deletion implemented and declared where required
- [ ] Data retention/deletion behavior documented
- [ ] Third-party SDK data behavior reviewed

## Payments and Commerce

- [ ] QRIS flow tested
- [ ] No payment provider secrets in AAB
- [ ] Webhook/reconciliation tested
- [ ] Cancellation/refund wording accurate
- [ ] Purchase/order data handling documented

## Quality

- [ ] API 28 test
- [ ] API 36/current target test
- [ ] Physical-device smoke test
- [ ] Background/resume payment test
- [ ] Network interruption test
- [ ] Notification test
- [ ] Location denied test
- [ ] Accessibility review
- [ ] Crash/ANR review

## Store Content

- [ ] App name/assets approved
- [ ] App icon approved
- [ ] Screenshots are actual product UI
- [ ] Content rating complete
- [ ] Target audience complete
- [ ] Ads declaration accurate
- [ ] Support contact available

## Final Rule

Do not mark this checklist complete from documentation alone. Verify against the actual Play Console release.
