# Roadmap

Roadmap items describe planned sequencing, not completed work.

## Foundation

- Repository rules and project memory
- Architecture and product documentation
- Android/iOS platform policy
- Payment architecture
- Design system
- Security baseline

## Milestone 0.1: Ordering Foundation

- Flutter Android/iOS scaffold
- Backend scaffold
- App theme/tokens
- Navigation
- Outlet model
- Categories
- Products
- Dynamic modifier groups/options
- Product detail/customization
- Cart

Success condition:
A product can be configured and added to cart as a distinct configuration.

## Milestone 0.2: Pickup Checkout + Payment

- Pickup outlet context
- Order creation
- Checkout
- AutoGoPay provider adapter
- QRIS generation
- Native QR payment presentation
- Payment status endpoint
- Webhook verification
- Idempotency
- Realtime/fallback reconciliation
- Pending payment cancel
- Expiry

Success condition:
A customer can place and pay for a pickup order, with server-authoritative automatic payment detection.

## Milestone 0.3: Fulfillment + Fusion Points

- Order state tracking
- POS/KDS minimum workflow
- Preparing
- Ready
- Picked up
- Completed
- Rewards ledger
- Fusion Points earning
- Order history

## Milestone 0.4: Retention

- Rewards catalog
- Point redemption
- Vouchers
- Favorites
- Reorder
- Membership tiers
- Campaign multipliers/missions

## Milestone 0.5: Operations

- Recipes/BOM
- Ingredients
- Packaging
- Operational supplies
- Inventory by outlet
- Stock movements
- Waste
- Stock opname
- Transfers
- Suppliers
- Purchasing
- Goods receiving
- Recipe costing/COGS
- Assets and maintenance

## Milestone 0.6: Delivery

- Address management
- Location permission UX
- Maps/search/pin
- Service area
- Route distance
- Delivery fees
- Outlet routing
- Courier/provider abstraction
- Delivery states/tracking

## Milestone 0.7: Digital Benefits

- Digital receipt
- Wi-Fi entitlement
- AI entitlement/quota
- Membership-linked benefits

## Release Readiness

Before production:
- Android Play policy re-check
- iOS App Store policy re-check
- Privacy policy
- Data Safety mapping
- Account deletion
- Signing and package verification
- Dependency/SDK audit
- Security review
- Crash/ANR monitoring
- Accessibility review
