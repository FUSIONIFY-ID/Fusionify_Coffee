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

Status: **Complete**

- Flutter Android/iOS scaffold
- Backend scaffold
- Material 3 theme/tokens
- Adaptive navigation
- Outlet model
- Categories
- Products
- Dynamic modifier groups/options
- Product detail/customization
- Cart
- Dio/Riverpod API boundary
- Prisma 7 PostgreSQL adapter
- Initial migration
- Development seed
- Database-backed catalog
- CI against PostgreSQL

Success condition:
A product can be configured and added to cart as a distinct configuration using a database-backed development catalog.

## Milestone 0.2: Pickup Checkout + Payment

Status: **Next**

- Pickup outlet context
- Server-authoritative cart/checkout validation
- Order + OrderItem persistence
- Payment persistence
- Order state machine
- Payment state machine
- Payment provider abstraction
- Payment channel capabilities
- AutoGoPay GoPay QRIS adapter as first channel
- QRIS generation
- Native QR payment presentation
- Payment status endpoint
- Raw-body webhook HMAC verification
- Webhook/status idempotency
- Realtime/fallback reconciliation
- Pending payment cancel when supported
- Expiry
- App background/resume reconciliation
- Channel-specific external references
- Preparation for ShopeePay/QRIS Interactive
- Backend polling strategy for QRIS Interactive if enabled

Success condition:
A customer can place and pay for a pickup order, with server-authoritative automatic payment detection and safe recovery after missed realtime/webhook events.

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
- Re-validate payment provider operational/legal terms
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
