---
name: payment-review
description: Review Fusionify Coffee payment changes for provider isolation, security, idempotency, and correct state transitions.
---

# Payment Review

Check:
- Provider private credentials exist only server-side
- App never treats client-provided amount as authoritative
- Payment create/status/cancel operations map through a provider adapter
- Webhook authentication is implemented according to provider documentation
- Duplicate webhook delivery is safe
- Local payment state and order state are separate
- Pending, paid, expired, cancelled, and failed paths are handled
- Cancelling a pending payment is not confused with refunding a paid order
- Rewards are not credited twice
- Stock/order fulfillment is not triggered twice
- Transaction IDs are unique and auditable
- Reconciliation can recover from missed realtime updates
- Provider raw state is retained when useful for audit/debugging
