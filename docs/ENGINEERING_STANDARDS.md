# Engineering Standards

## Core Principle

Correct, maintainable, testable behavior is more important than generated-code volume.

## Code

Prefer:
- Explicit names
- Small coherent modules
- Typed boundaries
- Clear state transitions
- Pure business logic where practical
- Dependency injection where it serves testability and architecture

Avoid:
- Generic utility dumping grounds
- Premature abstractions
- Deep inheritance
- Silent catches
- Magic numbers
- Repeated business rules in UI
- Generated comments that restate code

## Dependencies

Before adding a dependency:
1. Define the problem.
2. Check whether the current stack already solves it.
3. Check maintenance/activity.
4. Review permissions/platform implications.
5. Review security advisories when applicable.
6. Confirm Android/iOS support.

## Flutter

- Keep product/business rules out of large widgets.
- Model async states intentionally.
- Centralize API configuration.
- Use secure storage for sensitive session material.
- Use design tokens.
- Keep navigation declarative through GoRouter.
- Use Riverpod consistently rather than mixing state-management approaches without reason.

## Backend

- Validate external input.
- Keep provider integrations isolated.
- Make important state transitions explicit.
- Design idempotent mutation endpoints/events where duplicate delivery is plausible.
- Test business rules independently from transport when practical.
- Use database transactions for multi-write invariants where needed.

## Payments

Never:
- Trust client amount
- Mark payment paid from a client button
- Expose provider secret keys in Flutter
- Credit points twice due to duplicate webhooks
- Confuse pending-payment cancellation with refund

## Inventory

Inventory movement should record reason/type.

Expected types may include:
- PURCHASE
- SALE
- WASTE
- TRANSFER_IN
- TRANSFER_OUT
- ADJUSTMENT
- RETURN
- EXPIRED
- DAMAGED
- STOCK_OPNAME

Recipes/BOM connect sold products/modifiers to ingredient usage.

## Validation Reporting

Use:
- PASS
- FAIL
- NOT RUN

Do not use vague statements like "should work".

## Documentation

Code behavior, documentation, and project-state memory should agree.

Durable architecture changes require an ADR.
