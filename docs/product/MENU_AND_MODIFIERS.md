# Menu and Modifiers

## Goal

Menu data is dynamic, outlet-aware, and configurable without shipping a new mobile build for ordinary catalog changes.

## Core Entities

Suggested conceptual entities:
- Category
- Product
- ProductVariant where needed
- ModifierGroup
- ModifierOption
- OutletProductAvailability
- ProductImage

## Modifier Groups

Examples:
- Size
- Temperature
- Sugar level
- Ice level
- Milk
- Espresso
- Syrup
- Topping
- Add-on

A group should be able to express:
- Required/optional
- Minimum selections
- Maximum selections
- Default option
- Additional price
- Availability

## Cart Identity

Two cart lines are different when their selected configuration differs.

Example:

```text
Caramel Latte
Large
Iced
50% Sugar
Oat Milk
Extra Shot
```

is not the same cart line as the same base product with fresh milk and no extra shot.

## Pricing

Client may display calculated prices, but backend must calculate/validate authoritative totals during checkout.

## Inventory Mapping

Future recipe/inventory rules may map:
- Product base recipe -> ingredients
- Modifier option -> additional/replacement ingredient usage

Example:
- Oat Milk -> replace fresh milk usage
- Extra Shot -> add coffee bean usage

Do not bake inventory-specific logic into Flutter widgets.

## Availability

Availability can vary by outlet because:
- Product disabled
- Ingredient unavailable
- Packaging unavailable
- Time window
- Operational status

Customer UI must clearly represent unavailable choices without silently changing a customer's selected configuration.
