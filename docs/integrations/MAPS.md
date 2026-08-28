# Maps and Location

Status: provider not locked.

## Principle

Maps and delivery logistics are separate concerns.

Maps/location handles:
- Address search
- Place selection
- Current location
- Map pin
- Distance/route
- Outlet proximity

Delivery logistics handles:
- Courier/provider
- Assignment
- Pickup by courier
- On-the-way state
- Delivery completion

## Pickup MVP

The first maps/location use can be simple:
- User optionally uses current location
- App suggests nearby outlets
- User can manually choose any eligible outlet

Pickup must not depend on granting location permission.

## Delivery

Planned delivery address model includes:
- Search result/place reference where applicable
- Latitude
- Longitude
- Formatted address
- Address detail
- Delivery note
- Label such as Home/Work/Campus/Other

A precise map pin does not replace human address detail in Indonesia.

## Provider Direction

Google Maps Platform is a candidate because of place/address search and route capabilities.

Mapbox or another provider may remain possible.

Do not tightly couple domain models to a provider-specific place object.

## Outlet Selection

Nearest straight-line distance alone should not decide serving outlet.

Future routing may consider:
- Outlet open state
- Accepting orders
- Product availability
- Delivery enabled
- Service area/radius
- Route distance
- Kitchen load
- Courier availability

## Cost and Privacy

Before choosing/implementing a provider:
- Review current pricing
- Restrict API keys appropriately
- Review mobile and server key separation
- Review caching/storage terms
- Review privacy/data declarations
