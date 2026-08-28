# Loyalty and Membership

## Separation

Fusion Points and Membership are separate concepts.

- Points are a reward currency/ledger.
- Membership is a customer status/tier.

## Fusion Points

The points system should be configurable.

Potential earning factors:
- Eligible completed order
- Spend threshold/rate
- Campaign multiplier
- Membership multiplier
- Mission/reward event

Do not hardcode an earning rate in the mobile app.

## Points Ledger

Every balance-changing operation must have an auditable transaction.

Conceptual types:
- ORDER_REWARD
- CAMPAIGN_BONUS
- WELCOME_BONUS
- BIRTHDAY_BONUS
- REDEEM_REWARD
- REFUND_REVERSAL
- MANUAL_ADJUSTMENT

A mutable cached balance may exist for performance but the ledger is the audit source.

## Crediting

Do not award points when a QR/payment is merely created.

Initial safe direction:
- Payment confirmed
- Order becomes eligible
- Points credited according to configured business event, preferably completion unless product rules explicitly state otherwise

The exact eligibility event must be locked before implementation.

## Membership

Possible future tiers:
- Member
- Silver
- Gold
- Platinum

Names/thresholds/benefits are not yet final.

Membership benefits must provide actual value, potentially:
- Point multipliers
- Birthday reward
- Selected free add-on
- Exclusive campaign access
- Delivery benefit
- Digital Wi-Fi/AI benefit

Do not ship decorative tiers with no meaningful behavior.

## Redemption

Reward definitions should be configurable:
- Point cost
- Eligible products/categories
- Validity
- Outlet eligibility
- Redemption limits

Backend validates all redemption rules.
