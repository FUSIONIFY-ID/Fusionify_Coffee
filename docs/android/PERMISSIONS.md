# Android Permission Policy

## Principle

The customer app uses minimum necessary permissions.

Do not request a permission because a plugin asks for it by default. Understand and justify it.

## Expected

### INTERNET

Required for:
- Fusionify Coffee API
- Menu/content
- Payment
- Maps/network services
- Realtime/notifications setup

### POST_NOTIFICATIONS

Use for customer-visible value such as:
- Order confirmed
- Preparing/ready updates
- Delivery updates
- Meaningful rewards/campaign notifications when allowed

Request at an appropriate moment. The app must remain usable if denied.

### ACCESS_COARSE_LOCATION

May be used for nearby-outlet assistance.

### ACCESS_FINE_LOCATION

May be requested only when the user intentionally asks to use precise current location for features such as outlet discovery or delivery pin assistance.

The app must support manual location/address entry where practical.

## Prohibited by Default

### ACCESS_BACKGROUND_LOCATION

Not required for the current customer product.

Do not add without:
- Approved product requirement
- Privacy review
- Play policy review
- Updated docs/ADR
- User-facing disclosure design

### Broad Media Permissions

Avoid broad photo/media-library permissions.

Use platform/system Photo Picker when the product only needs the user to select an image.

### Contacts / SMS / Call Logs

Not part of current customer product scope.

Do not request.

### Exact Alarm

Not part of current product scope.

Do not request merely for local reminders when normal scheduling/push is sufficient.

## Camera

Do not request unless a real feature needs camera capture or scanning.

Displaying a QRIS code does not require camera permission.

## Location UX

Preferred flow:

1. Explain why location is useful.
2. User chooses "Use current location".
3. Trigger system permission.
4. Handle allowed/denied/permanently denied states.
5. Keep manual outlet/address selection available.

Never block unrelated browsing merely because location is denied.

## Documentation

Any newly requested permission requires:
- Product reason
- Platform reason
- Privacy impact review
- Documentation update
- Relevant store declaration review
