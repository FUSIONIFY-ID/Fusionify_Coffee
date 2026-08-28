# Product

## Vision

Fusionify Coffee is a coffee ordering and coffee-shop operations platform designed for a polished everyday customer experience on Android and iOS.

The product should reach the usability quality expected from major coffee-chain applications while remaining visually and behaviorally original to Fusionify.

## Customer Jobs

A customer should be able to:

1. Find or select an outlet.
2. Choose pickup or delivery.
3. Browse menu categories and campaigns.
4. Customize products.
5. Add products to cart.
6. Apply eligible vouchers or rewards.
7. Pay without leaving the intended app flow where provider capabilities allow.
8. See payment and order status clearly.
9. Receive pickup/delivery updates.
10. Earn and redeem Fusion Points.
11. Progress through membership tiers when membership launches.
12. Reorder favorites or previous purchases.

## Product Customization

A menu item may expose configurable groups such as:
- Size
- Temperature
- Sugar level
- Ice level
- Milk
- Espresso shots
- Syrups
- Toppings
- Add-ons

Modifiers are dynamic backend data. Do not hardcode product-specific price rules into the mobile UI.

## Fulfillment

### Pickup

Pickup is the first fulfillment mode to be implemented completely.

Expected flow:
- Select outlet
- View menu availability for that outlet
- Place order
- Pay
- Outlet confirms
- Preparing
- Ready for pickup
- Picked up
- Completed

### Delivery

Delivery is planned after the pickup vertical slice is stable.

Delivery will include:
- Address search
- Current location when user grants permission
- Precise map pin
- Address notes
- Service-area validation
- Outlet selection/routing
- Delivery fee
- Courier/provider abstraction
- Delivery tracking states

Maps and courier/logistics providers are separate concerns.

## Loyalty

Fusion Points and membership are separate systems.

Fusion Points:
- Earned according to configurable rules
- Recorded in an auditable ledger
- Credited only after an eligible business event
- Reversed when required
- Redeemable for configured rewards

Membership:
- Represents customer status/tier
- Can affect benefits and earning multipliers
- Must be configurable
- Must provide actual customer value, not decorative status only

## Payments

The initial payment method is QRIS through AutoGoPay as a temporary provider.

The customer application should show a native Fusionify Coffee payment experience using provider-returned QR data where supported.

Payment creation, status, cancellation, webhook handling, and reconciliation are server responsibilities.

## Operations

Planned operating capabilities:
- POS
- KDS
- Recipe/BOM
- Ingredient inventory
- Packaging inventory
- Operational supplies
- Stock movement ledger
- Waste
- Stock opname
- Outlet-to-outlet stock transfer
- Suppliers
- Purchase request/order/receiving
- Equipment assets and maintenance
- COGS and recipe costing

## Digital Benefits

A future completed order may unlock digital benefits such as:
- Time-limited outlet Wi-Fi access
- Time-limited or quota-based AI access
- Digital receipt benefits

These are future features and are not currently implemented.

## Product Principle

Technology should be powerful underneath but quiet in the customer interface.

Customers should see:
- "Pesananmu siap diambil"

not:
- WebSocket
- NestJS
- HMAC
- AI Gateway internals
