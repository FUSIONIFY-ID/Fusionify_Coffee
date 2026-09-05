# Asset Guidelines

## Asset Categories

Bundled application assets:
- Official logo/mark
- App icon source
- Native splash asset
- Static illustrations
- Empty/error state assets
- Product placeholder
- Reward/point icon assets
- Membership badges when approved

Dynamic backend/CDN assets:
- Product photos
- Promo banners
- Campaign artwork
- Voucher artwork
- Outlet photos
- Seasonal content

The current customer app contains a small, documented preview set for visual review before a production media pipeline is available. This is an explicit development exception, not permission to bundle future live catalog or campaign libraries.

## Recommended Customer App Structure

```text
assets/
  animations/
  brand/
  campaigns/
  illustrations/
  membership/
  outlets/
  products/
  fonts/
```

Current preview files and their generation notes are recorded in `apps/customer/assets/ASSET_PROVENANCE.md`.

## Formats

Preferred direction:
- Logo/vector artwork: SVG
- Static illustrations: SVG or WebP
- Product photography: WebP
- Campaign/banner photography: WebP
- App icon master: high-resolution PNG/source asset as platform tooling requires

## Product Images

Recommended source aspect ratio:
- Product: 1:1, for example 1200x1200
- Promo/banner: documented campaign ratio such as 2:1 or 16:9
- Profile/avatar: 1:1

Do not bundle the entire live menu catalog into the mobile binary.

The six current product images are preview fallbacks for the seeded development products. The catalog API now carries product, campaign, and outlet media references. Production records should provide backend-managed HTTPS URLs, while `asset://` references are reserved for known bundled demo assets. The app includes explicit fallback and failure states.

## Membership Backgrounds

Membership artwork is decorative background material only. Render tier, customer, progress, and accessibility text in the application.

Do not include:
- payment-network or card-issuer logos
- payment chips
- card numbers, expiry, security codes, or magnetic-stripe cues
- copied portraits or distinctive third-party card artwork

The highest visual tier may use a dark premium finish under the Fusion Black name while remaining an original Fusionify loyalty credential.

## Splash

Native splash:
- Simple
- Solid background
- Official mark when available
- No forced delay
- No decorative gradient

In-app loading may use a subtle brand animation after the framework is running.

## App Icon

Do not shrink a long wordmark into the app icon.

Use an approved recognizable mark designed for small sizes.

The current `fusion-f-bean` mark and platform icon set are provisional development artwork. They must not be described as the official Fusionify Coffee logo before approval.

## Accessibility

Membership tiers and state badges must differ by more than color alone.
