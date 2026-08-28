# AutoGoPay Integration

Status: GoPay QRIS integration code implemented for Milestone 0.2; live provider validation pending.

Documentation re-validated: 2026-08-28

## Implementation State

Implemented in the Fusionify Coffee backend:
- GoPay QRIS provider adapter
- server-side Bearer authentication
- create QRIS
- manual status check
- pending cancellation
- raw-body HMAC-SHA256 webhook verification
- provider status normalization
- amount verification
- local payment persistence
- one-pending-payment-per-order database guard
- order confirmation when payment becomes PAID
- idempotency keys at Fusionify checkout/payment boundaries

Implemented in Flutter:
- server-authoritative checkout
- native QR rendering from `qr_string`
- local Fusionify payment-status polling
- manual provider reconciliation through Fusionify API
- pending cancel action
- payment expiry countdown when provider expiry parses successfully
- cart clearing only after PAID

Not yet validated live:
- real AutoGoPay QR generation
- real provider webhook delivery
- real manual status response
- real pending cancellation response shape
- production callback URL/network configuration

Automated tests use mocked provider responses and an intentionally unconfigured provider path. No real API key is stored in the repository.

Provider documentation:
- https://autogopay.site/docs

## Current Provider Update

AutoGoPay now documents three QRIS-capable channels:
- GoPay QRIS
- ShopeePay QRIS
- QRIS Interactive

QRIS Interactive is documented as the new provider replacing OrderKuota.

These channels do not expose identical capabilities. Fusionify Coffee must not treat AutoGoPay as one uniform QRIS endpoint.

## Base Contract

Base URL:

```text
https://v1-gateway.autogopay.site
```

Authentication:

```http
Authorization: Bearer <AUTOGOPAY_API_KEY>
```

The API key is server-side only. Flutter must never call AutoGoPay directly.

## Channel Capability Matrix

| Channel | Create | Status | Provider auto-poller | Automatic webhook | Cancel documented |
| --- | --- | --- | --- | --- | --- |
| GoPay QRIS | `POST /qris/generate` | `POST /qris/status` with `transaction_id` | Yes, every ~3s | Yes | Yes, `POST /qris/cancel` |
| ShopeePay QRIS | `POST /shopeepay/qris/create` | `GET /shopeepay/qris/status?order_sn=...` | Yes, every ~3s | Yes | Not documented |
| QRIS Interactive | `POST /interactive/qris/create` | `POST /interactive/qris/status` with `invoice_id` + `ref_no` | No provider auto-poller documented | Webhook is triggered when status is manually checked | Not documented |

Do not invent cancel/refund support for channels where the provider does not document it.

## Milestone 0.2 Initial Channel

Recommended first implementation: **GoPay QRIS**.

Reason:
- Generate QRIS is documented.
- Manual status check is documented.
- Auto-poller + webhook are documented.
- Pending cancellation is documented.

This best matches the current Fusionify Coffee requirement:
- native in-app QR
- automatic payment detection
- manual status fallback
- cancel pending payment

This is an implementation default, not a permanent provider lock.

ShopeePay and QRIS Interactive should fit behind the same Fusionify payment abstraction through channel-specific adapters/capabilities.

## GoPay QRIS Flow

Create:

```http
POST /qris/generate
```

Request:

```json
{
  "amount": 10000
}
```

Relevant response fields:
- `transaction_id`
- `order_id`
- `amount`
- `transaction_status`
- `qr_string`
- `qr_url`
- `checkout_url`
- `transaction_time`
- `expiry_time`

Current documented amount range:
- IDR 1 through IDR 10,000,000

Status:

```http
POST /qris/status
```

Request:

```json
{
  "transaction_id": "..."
}
```

Documented raw states:
- `pending`
- `settlement`
- `expire`
- `cancel`

Cancel pending:

```http
POST /qris/cancel
```

Request:

```json
{
  "transaction_id": "..."
}
```

Only expose cancellation in Fusionify Coffee while local payment state is still pending.

## ShopeePay QRIS Flow

Create:

```http
POST /shopeepay/qris/create
```

Relevant response fields:
- `amount`
- `order_sn`
- `nmid`
- `qr_string`
- `qr_url`
- `transaction_time`
- `expiry_time`

Status:

```http
GET /shopeepay/qris/status?order_sn=<ORDER_SN>
```

Relevant response fields:
- `status`
- `order_status`
- `paid`
- `amount`
- `paid_at`

Current docs describe:
- `order_status = 2` / pending
- `order_status = 1` / success
- `paid = true` when payment is received

No pending-cancel endpoint is documented for this channel in the reviewed documentation.

## QRIS Interactive Flow

Create:

```http
POST /interactive/qris/create
```

Relevant response fields:
- `amount`
- `qr_string`
- `qr_url`
- `invoice_id`
- `ref_no`
- `timestamp`
- `expired_date`

Status:

```http
POST /interactive/qris/status
```

Request:

```json
{
  "invoice_id": "...",
  "ref_no": "..."
}
```

Successful status may include:
- `status = success`
- `issuer_name`
- `customer_name`
- `paid_at`
- `amount`
- `tran_id`
- `rrn`

Pending response currently documents:
- top-level `success = false`
- `data.status = pending`

Therefore the adapter must not equate top-level `success = false` with a failed payment. For Interactive status, it may mean the payment is simply still pending.

## Interactive Detection Strategy

QRIS Interactive does not currently document the same provider-side auto-poller behavior as GoPay/ShopeePay.

The provider documentation says its webhook is sent when `/interactive/qris/status` is manually checked.

If Fusionify Coffee later enables Interactive:
1. Fusionify backend creates the QR.
2. Store both `invoice_id` and `ref_no`.
3. Fusionify backend performs bounded status polling, or checks on client-triggered refresh/resume.
4. A successful status response idempotently settles the local payment.
5. Any webhook generated by the provider is treated as another authenticated signal, not the sole source of truth.

Flutter must not poll AutoGoPay directly.

## Expiry Rule

Do not hardcode one global AutoGoPay TTL.

Current documentation contains inconsistent Interactive expiry information:
- descriptive text says QRIS is valid for 15 minutes
- the current response example shows an `expired_date` one hour after `timestamp`

Implementation rule:
- store provider-returned expiry when available
- display countdown from the stored authoritative local expiry
- re-check provider state before declaring success
- treat provider TTL as a contract that must be re-validated before production

## Payment Provider Abstraction

Conceptual contract:

```ts
type PaymentProviderCapabilities = {
  supportsAutomaticWebhook: boolean;
  supportsManualStatus: boolean;
  supportsPendingCancel: boolean;
  requiresBackendPolling: boolean;
};

interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  getStatus(reference: PaymentProviderReference): Promise<PaymentStatus>;
  cancelPendingPayment?(
    reference: PaymentProviderReference,
  ): Promise<void>;
  verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhook>;
  capabilities(): PaymentProviderCapabilities;
}
```

AutoGoPay-specific channel behavior remains inside the AutoGoPay integration layer.

Customer application code must only understand normalized Fusionify payment state.

## Local Payment Reference Storage

Payment persistence should be able to retain channel-specific identifiers without overloading one field.

Suggested fields:
- `provider = AUTOGOPAY`
- `providerChannel = GOPAY_QRIS | SHOPEEPAY_QRIS | INTERACTIVE_QRIS`
- `providerTransactionId`
- `providerOrderId`
- `providerOrderSn`
- `providerInvoiceId`
- `providerRefNo`
- `providerRawStatus`
- `providerMetadata`
- `expiresAt`

Only populate identifiers relevant to the selected channel.

## Normalized Payment States

Fusionify application states:

- `PENDING`
- `PAID`
- `EXPIRED`
- `CANCELLED`
- `FAILED`
- `REFUNDED`

Examples:
- GoPay `pending` -> `PENDING`
- GoPay `settlement` -> `PAID`
- GoPay `expire` -> `EXPIRED`
- GoPay `cancel` -> `CANCELLED`
- ShopeePay `paid = true` -> `PAID`
- Interactive `data.status = pending` -> `PENDING`
- Interactive `data.status = success` -> `PAID`

Store the provider raw status separately.

## Webhook Contract

Current AutoGoPay docs describe webhook support for:
- GoPay QRIS
- ShopeePay QRIS
- QRIS Interactive

Webhook headers include:
- `Content-Type: application/json`
- `X-Callback-Event: transaction.received`
- `X-Signature`: HMAC-SHA256 signature

Current documented payment methods:
- `QRIS`
- `QRIS_SHOPEEPAY`
- `QRIS_INTERACTIVE`

Important provider requirements:
- HTTPS in production
- respond HTTP 200 within 10 seconds
- check duplicate `transaction_id`
- distinguish provider/channel from `payment_method`

## Webhook Signature Security

The documented signature model uses HMAC-SHA256 with the API key as secret.

Fusionify implementation must verify against the **raw HTTP request body** before JSON mutation/re-serialization.

Do not rely on `JSON.stringify(req.body)` as the canonical signing input unless AutoGoPay explicitly guarantees that representation.

Use:
- raw body capture in NestJS
- HMAC-SHA256
- constant-time comparison
- no signature/API-key logging
- rejection before business processing when verification fails

## Idempotency

Provider events/status checks may arrive repeatedly.

Use local uniqueness/idempotency controls so duplicate provider signals cannot:
- mark the same payment paid twice
- confirm an order twice
- grant Fusion Points twice
- reduce inventory twice
- emit duplicate KDS/POS events

## In-App QR

Flutter should render the provider-returned `qr_string` inside Fusionify Coffee UI where technically permitted.

Do not require the customer to open the provider checkout page for the normal app flow.

The provider `checkout_url` may be retained as a fallback or support tool.

## Refunds

No refund API was identified in the reviewed QRIS documentation.

Do not implement or advertise automated refund support until a documented provider contract exists.

Paid-order cancellation and refunds remain a separate business process from cancelling a pending QRIS payment.
