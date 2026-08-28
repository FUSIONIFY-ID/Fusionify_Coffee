# Inventory

## Goal

Inventory tracks real ingredient, packaging, supply, and outlet movement rather than only a manually edited stock number.

## Categories

### Ingredients
Examples:
- Coffee beans
- Fresh milk
- Oat milk
- Syrup
- Powder
- Ice
- Pastry ingredients/items

### Packaging
Examples:
- Cup
- Lid
- Straw
- Tissue
- Paper bag
- Cup holder

### Operational Supplies
Examples:
- Cleaning chemicals
- Trash bags
- Thermal paper
- Filters
- Gloves

### Assets
Equipment such as espresso machines, grinders, refrigerators, POS devices, routers, and printers belong to asset management, not consumable inventory.

## Recipe / BOM

A sold product maps to ingredient and packaging usage.

Example:

```text
Caramel Latte 16 oz
- Coffee beans: 18 g
- Fresh milk: 180 ml
- Caramel syrup: 20 ml
- Ice: 150 g
- Cup 16 oz: 1
- Lid 16 oz: 1
```

Modifiers can replace/add usage.

## Stock Movement

Do not store only a mutable stock quantity with no history.

Movement types may include:
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

Every movement should capture:
- Outlet
- Item
- Quantity and unit
- Type/reason
- Reference entity when relevant
- Actor/system source
- Timestamp

## Waste

Waste should support reasons such as:
- Expired
- Preparation mistake
- Customer remake
- Damage/spillage
- Calibration
- Quality rejection

## Multi-Outlet

Stock is outlet-specific.

Transfers use explicit transfer records and receiving acknowledgement rather than silently editing both balances.

## Procurement

Future flow:
- Purchase request
- Purchase order
- Goods receiving
- Stock movement
- Supplier invoice/reference as required

## Reorder

Future configurable concepts:
- Minimum stock
- Reorder point
- Safety stock
- Supplier lead time

Forecasting should come after trustworthy transaction/inventory history exists.
