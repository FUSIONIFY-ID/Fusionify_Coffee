# Delivery

Status: application foundation implemented; external provider integration pending.

## Scope

Delivery adds:
- Saved addresses
- Search and map pin
- Serviceability
- Route distance
- Delivery fee
- Serving outlet selection
- Courier/provider integration
- Delivery tracking

Implemented today:
- saved address CRUD
- configured outlet radius/serviceability checks
- server-calculated base and per-kilometer delivery fees
- outlet delivery capability exposed to the customer app
- checkout support for delivery address, quote, and authoritative validation

Not yet live:
- production address search/geocoding and route-distance provider
- courier assignment/provider integration
- courier tracking lifecycle

## Address

A delivery address should support:
- Latitude/longitude
- Formatted address
- Human-readable detail
- Delivery note
- Label

Do not rely on coordinates alone for Indonesian delivery context.

## Serviceability

Initial serviceability can be based on simple configured rules such as service radius or route distance.

Future logic may consider:
- Open outlet
- Delivery enabled
- Menu availability
- Kitchen load
- Courier availability
- Route distance

## Fees

Delivery fee must be calculated server-side using configured rules/provider result.

The mobile client may display estimates but is not authoritative.

## Logistics Provider

Use an abstraction so Fusionify-owned delivery and third-party delivery providers can coexist later.

Do not treat map provider as courier provider.

## Tracking States

Possible normalized states:
- DELIVERY_PENDING
- COURIER_ASSIGNMENT_PENDING
- COURIER_ASSIGNED
- PICKED_UP_BY_COURIER
- ON_THE_WAY
- DELIVERED
- DELIVERY_FAILED

Final model should be introduced only with an implemented delivery provider/process.
