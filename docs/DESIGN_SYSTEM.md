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

## Material 3 Foundation

Flutter Material 3 is the UI foundation.

Current implementation uses:
- `useMaterial3: true`
- Material 3 seed-based `ColorScheme`
- Material 2021 typography baseline
- Material 3 AppBar
- NavigationBar
- NavigationRail for wide layouts
- Filled/Outlined/Text buttons
- ChoiceChip / FilterChip
- Material cards
- Bottom sheet theme
- Snackbar theme
- Input decoration theme
- Progress indicators
- Edge-to-edge system UI

Material 3 is the component/interaction foundation, not permission to make the product visually identical to Google apps.

Fusionify brand identity remains authoritative.

System Dynamic Color / Material You recoloring is intentionally not enabled because it could replace locked Fusionify brand colors. Revisit only through a deliberate design decision.

## Adaptive Navigation

- Phone layouts use Material 3 `NavigationBar`.
- Wide/tablet layouts use Material 3 `NavigationRail`.
- Current breakpoint is an implementation baseline and may be tuned after device testing.
- Tablet/foldable layouts must remain functional even if phone remains the primary commercial target.

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
- surfaceBlue
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

Current scale:
- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48

## Radius

Use a small controlled set.

Current direction:
- Small controls: 8
- Inputs/buttons: 12
- Cards: 16
- Sheets: 24

Do not make every object a pill or oversized rounded rectangle.

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
2. Fusion Points/rewards visibility when implemented
3. One meaningful campaign area when real campaign content exists
4. Pickup / Delivery
5. Recommended products
6. Buy Again when order history exists
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

## Membership Credential

Membership is presented as a digital loyalty credential with an approximately 1.586:1 card proportion.

Visual rank mapping:
- rank 1 or an unconfigured base member: Fusion Blue
- rank 2: Fusion Silver
- rank 3: Fusion Gold
- rank 4 and above: Fusion Black

Tier name, customer name, membership/progress copy, and accessibility semantics must be rendered by Flutter. Background artwork must not contain variable member data.

The visual may communicate the weight and restraint of a premium physical card, but it must remain unmistakably Fusionify. Do not add:
- payment-network logos
- a payment chip
- PAN, expiry, or CVV fields
- American Express Centurion portrait or trade dress
- copied patterns, composition, or proprietary artwork from existing card issuers

Tier identity must differ through label and material treatment, not color alone. Fusion Black is the highest visual treatment, not a claim that the credential is a bank card.

## Loading

Prefer skeleton/loading placeholders for content lists when they improve perceived performance.

Current catalog flow includes:
- Skeleton loading
- Explicit error state
- Retry action
- Pull-to-refresh on Home

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

Material icons are acceptable during application foundation work.

Official/custom brand iconography should replace temporary generic product imagery when approved assets exist.

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
