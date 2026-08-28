# ADR 0006: Model AutoGoPay as Channel-Aware Payment Integration

Date: 2026-08-28
Status: Accepted

## Context

AutoGoPay documentation reviewed on 2026-08-28 exposes multiple QRIS channels:
- GoPay QRIS
- ShopeePay QRIS
- QRIS Interactive

The channels have different identifiers, endpoints, status contracts, webhook behavior, and cancellation capabilities.

In particular:
- GoPay QRIS documents generate, status, provider auto-polling/webhook, and pending cancellation.
- ShopeePay QRIS documents generate, status, provider auto-polling/webhook, but no pending-cancel endpoint in the reviewed docs.
- QRIS Interactive documents generate and status using `invoice_id` + `ref_no`; provider webhook behavior depends on a manual status check and no cancel endpoint is documented.

Treating all AutoGoPay QRIS operations as one identical contract would leak provider-specific assumptions into Fusionify Coffee business logic.

## Decision

AutoGoPay remains one external payment provider, but its QRIS products are modeled as channel-specific implementations/capabilities inside the provider adapter.

The Fusionify payment domain will:
- normalize all channels to common local payment states
- persist channel-specific provider identifiers
- capability-gate pending cancellation
- capability-gate automatic webhook assumptions
- permit bounded backend polling for channels that require it
- keep all AutoGoPay credentials and provider calls server-side

Milestone 0.2 will initially target GoPay QRIS because it currently matches the required create/status/automatic-detection/cancel flow most completely.

This initial channel choice does not permanently lock Fusionify Coffee to GoPay QRIS.

## Consequences

Positive:
- Flutter remains provider-agnostic.
- Adding ShopeePay or Interactive does not require rewriting checkout UI/business state.
- Unsupported operations such as cancel can be hidden safely.
- Provider-specific identifier differences do not corrupt the local payment model.
- Automatic detection remains possible even when a channel requires Fusionify-side polling.

Costs:
- The provider layer needs explicit capabilities.
- Payment persistence needs several optional external-reference fields or structured metadata.
- Tests must cover channel-specific normalization.

## Alternatives Considered

### One generic AutoGoPay QRIS adapter with one transaction ID

Rejected because ShopeePay uses `order_sn` and Interactive uses `invoice_id` + `ref_no`.

### Use QRIS Interactive as the immediate default

Deferred because the reviewed docs do not expose pending cancellation and do not provide the same provider-side automatic polling semantics as GoPay/ShopeePay.

### Let Flutter call AutoGoPay directly

Rejected because it would expose provider credentials, duplicate payment logic across clients, and weaken webhook/status reconciliation.
