# Security Policy

## Reporting

Do not disclose exploitable security issues in a public issue. Report them privately to the project maintainers through an approved private channel.

## Secrets

Never commit:
- Environment files containing secrets
- API keys or bearer tokens
- Payment-provider secrets
- Database credentials
- Firebase or cloud private credentials that are not intended to be public
- Android keystores
- Signing passwords
- `android/key.properties`
- Apple signing private keys or certificates intended to remain private

A secret committed to Git must be treated as compromised even if removed in a later commit.

## Payment Security

- Flutter must never contain AutoGoPay or other payment-provider private API credentials.
- Payment creation/status/cancellation must be mediated by the Fusionify backend.
- Webhooks must be authenticated and idempotent.
- Amount, order ownership, provider transaction ID, and state transitions must be validated server-side.
- Duplicate webhook delivery must not duplicate rewards, stock movements, or order transitions.

## Mobile Security

- Store sensitive session material using platform-backed secure storage.
- Request minimum necessary runtime permissions.
- Do not use background location for the customer app without an approved product requirement and policy review.
- Do not request broad gallery/media access when a system picker satisfies the requirement.
- Do not disable TLS verification.

## Dependencies

Dependencies must be actively maintained, compatible with supported platforms, and reviewed for unnecessary permissions or security advisories before adoption.
