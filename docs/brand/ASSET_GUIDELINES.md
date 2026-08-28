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

## Recommended Customer App Structure

```text
assets/
  brand/
    logo/
    mascot/
  app/
    icon/
    splash/
    onboarding/
    empty_states/
    illustrations/
  ui/
    icons/
    badges/
    placeholders/
  fonts/
```

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

## Accessibility

Membership tiers and state badges must differ by more than color alone.
