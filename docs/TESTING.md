# Testing

## Philosophy

Test business behavior and risky boundaries, not generated line coverage for its own sake.

## Customer App

Expected layers:
- Unit tests for deterministic business logic
- Widget tests for critical interaction/state behavior
- Integration tests for high-value flows when infrastructure is available

Priority flows:
- Modifier price calculation
- Distinct cart configurations
- Checkout validation
- Payment state display
- Order-state progression
- Rewards presentation

## Backend

Priority:
- Input validation
- Order totals calculated server-side
- Payment state transitions
- Webhook authentication
- Webhook idempotency
- Duplicate event handling
- Rewards ledger idempotency
- Inventory movement invariants
- Outlet-aware availability

## Platform Matrix

Android baseline:
- API 28 minimum validation
- API 36 target validation
- At least one intermediate modern API/device profile where practical

iOS:
- Validate supported deployment target once set in scaffold
- Test current supported simulator/device profiles before release

## Reporting

Use explicit results:
- PASS
- FAIL
- NOT RUN with reason

Never convert a successful build into a claim that behavioral tests passed.
