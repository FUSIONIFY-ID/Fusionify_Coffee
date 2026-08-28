# ADR 0003: Isolate Payment Providers Behind an Adapter

Date: 2026-08-28
Status: Accepted

## Context

AutoGoPay is intended as the initial temporary QRIS payment provider. The application should be able to move to or add another provider later without rewriting the customer product around provider-specific terminology.

## Decision

Provider-private payment communication occurs only in the backend and is isolated behind a payment-provider integration boundary.

Flutter communicates only with Fusionify Coffee APIs.

Application payment states use provider-neutral vocabulary.

## Consequences

Benefits:
- Provider replacement is less invasive
- Provider secrets remain server-side
- Payment business rules remain Fusionify-controlled
- Customer UI is provider-independent

Cost:
- Backend must normalize provider behavior and handle capability differences intentionally.

## Alternatives Considered

Calling AutoGoPay directly from Flutter was rejected because it risks provider credential exposure and couples mobile behavior to the provider.
