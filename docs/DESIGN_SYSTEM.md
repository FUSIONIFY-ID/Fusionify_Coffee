# Design System

## Direction

Fusionify Coffee is a premium consumer coffee application.

It should feel:
- Fast
- Clear
- Warm
- Product-led
- Contemporary
- Trustworthy

It should not feel like:
- A SaaS dashboard
- A fintech dashboard with coffee photos
- A generic AI-generated landing page
- A clone of another coffee brand

## Hard Rule: No Gradients

Gradients are prohibited.

Use:
- Solid colors
- Strong typography
- Product photography
- Whitespace
- Borders
- Restrained elevation
- Clear hierarchy
- Purposeful motion

## Confirmed Fusionify Brand Colors

These colors are part of the current Fusionify family identity:

- Primary: `#0D6CD7`
- Deep: `#0261CC`
- Supporting: `#539DE9`

Do not make every surface blue.

Coffee-specific warm neutrals/accent values must be documented and approved before becoming permanent brand tokens.

## Color Roles

Use semantic tokens rather than raw values throughout feature UI.

Examples:
- primary
- onPrimary
- surface
- surfaceWarm
- textPrimary
- textSecondary
- border
- success
- warning
- error

Raw color literals should be confined to the design-token definition layer except for justified exceptional content.

## Typography

Priorities:
- Legibility
- Strong price hierarchy
- Clear modifier labels
- Good rendering on Android and iOS
- Indonesian and English character support

Avoid novelty typography for core ordering flows.

## Spacing

Use a documented spacing scale. Do not introduce arbitrary values for individual screens.

Suggested initial scale for implementation validation:
- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48

This scale can evolve through design review.

## Radius

Use a small controlled set.

Suggested initial direction:
- Small controls: 8
- Inputs/buttons: 10–12
- Cards: 12–16
- Sheets: 20–24 top corners

Do not make every object a pill or 30px rounded rectangle.

## Elevation

Prefer borders and surface separation over heavy shadows.

Elevation is appropriate for:
- Sticky checkout CTA
- Floating cart
- Modal/sheet separation
- Navigation where necessary

## Home Screen Hierarchy

Target hierarchy:

1. Context/greeting and current outlet/order mode
2. Fusion Points/rewards visibility
3. One meaningful campaign area
4. Pickup / Delivery
5. Recommended products
6. Buy Again
7. Category/menu discovery

Avoid stacking multiple promotional banners before ordering actions.

## Product Cards

Product cards should prioritize:
- High-quality product image
- Product name
- Short useful descriptor
- Price
- Clear add/customize action
- Minimal meaningful badge such as Bestseller when real

Avoid fake ratings, invented metrics, and badge clutter.

## Product Detail

The product image and customization flow are primary.

Expected groups may include:
- Size
- Temperature
- Sugar
- Ice
- Milk
- Toppings/add-ons

Use a persistent bottom action for quantity and final add-to-cart price where appropriate.

## Loading

Prefer skeleton/loading placeholders for content lists when they improve perceived performance.

Use a spinner/progress indicator for short operations such as:
- Applying voucher
- Checking payment
- Submitting an action

Never delay app startup only to display branding.

## Splash

Native splash should be simple and fast.

An in-app loading state may be used for session/config initialization after Flutter starts.

Do not force a fixed splash duration.

## Empty and Error States

Every meaningful empty/error state should:
- Explain what happened
- Provide the next useful action when one exists
- Use consistent illustration/icon language
- Avoid generic AI copy

## Iconography

Use a consistent production icon set.

Do not use emoji as primary product iconography.

## Accessibility

Design for:
- Readable text
- Sufficient contrast
- Scalable text
- Semantic labels
- Large enough interaction targets
- Status communicated by more than color alone
- Android gesture navigation
- iOS navigation behavior

## Responsive Design

Customer UI must remain usable on supported phone sizes.

Tablet/foldable layouts should not break even if phone is the primary target.

## Competitor Inspiration Policy

It is acceptable to study patterns such as:
- Fast order entry
- Visible pickup/delivery
- Strong menu imagery
- Clear modifiers
- Visible loyalty

It is not acceptable to copy:
- Exact visual composition
- Brand assets
- Proprietary copy
- Unique artwork
- Screens pixel-for-pixel
