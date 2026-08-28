# Pickup

Pickup is the first fulfillment mode to be completed end-to-end.

## Customer Flow

1. Select Pickup.
2. Select or confirm outlet.
3. Browse outlet-aware menu.
4. Customize products.
5. Checkout.
6. Complete payment.
7. Order confirmed.
8. Preparing.
9. Ready for pickup.
10. Picked up.
11. Completed.

## Outlet Selection

Location may suggest nearby outlets, but manual outlet selection remains available.

An outlet can expose:
- Open/closed
- Accepting orders
- Estimated preparation time
- Menu availability
- Pickup enabled

## Timing

Initial implementation may support ASAP.

Scheduled pickup can be added after real operating rules are defined. Do not fake schedule availability.

## Order State

Suggested relevant states:
- AWAITING_PAYMENT
- CONFIRMED
- PREPARING
- READY
- PICKED_UP
- COMPLETED
- CANCELLED

Transitions must be server-authoritative and auditable where operationally important.

## UX

Customer must always know:
- Which outlet
- Current status
- Whether payment succeeded
- What action is expected next
- When the order is ready
