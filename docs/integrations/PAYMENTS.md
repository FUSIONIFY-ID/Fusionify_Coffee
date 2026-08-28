# Payments

## Architecture Rule

Mobile clients never receive private payment-provider credentials.

```text
Flutter
  |
  v
Fusionify Coffee API
  |
  v
Payment Provider Adapter
  |
  +-- AutoGoPay
  +-- Future provider
```

## Application Payment States

Use provider-neutral states:

- PENDING
- PAID
- EXPIRED
- CANCELLED
- FAILED
- REFUNDED

Provider-specific raw status may also be stored for audit/debugging.

## Order States

Payment and order state are separate.

Example order states:
- AWAITING_PAYMENT
- CONFIRMED
- PREPARING
- READY
- PICKED_UP
- COMPLETED
- CANCELLED

Examples:
- Payment PAID + Order PREPARING is valid.
- Payment PENDING + Order AWAITING_PAYMENT is valid.
- Cancelling a PENDING payment is not a refund.

## Core Operations

Provider abstraction should support the capabilities actually needed:

- Create payment
- Retrieve/check payment status
- Cancel a pending payment when provider supports it
- Verify webhook
- Normalize provider status

Do not force every future provider into methods it cannot support. Extend capabilities intentionally.

## Webhooks

Webhook processing must:
1. Authenticate/verify provider webhook according to official provider protocol.
2. Identify the provider transaction.
3. Reject/ignore invalid transitions.
4. Validate relevant amount/order relationship.
5. Process idempotently.
6. Persist state before emitting downstream effects where appropriate.
7. Avoid duplicate rewards, stock reduction, or fulfillment transitions.

## Reconciliation

Realtime delivery can fail.

The backend must provide authoritative payment/order status to the app and support reconciliation against provider status where appropriate.

The customer-facing "Check Status" action should call Fusionify backend, not the provider directly.

## Cancellation

Before payment:
- A pending provider payment may be cancelled if supported.
- Corresponding order behavior should be explicit.

After payment:
- Do not present provider "cancel" as an automatic refund.
- Refund must be implemented as a separate capability when a provider and business process support it.

## Amount Authority

Server calculates/validates:
- Product prices
- Modifier prices
- Discounts
- Points redemption
- Delivery/service fees
- Final amount

Never trust a total submitted by a mobile client as authoritative.
