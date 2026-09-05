# Preview Asset Provenance

These assets were created for the Fusionify Coffee development preview on 2026-09-05. They are original project artwork and do not use competitor logos, payment-network marks, card-issuer branding, or copied proprietary imagery.

## Generation Mode

Product, campaign, outlet, and membership artwork was created with OpenAI's built-in image generation mode. Final app assets were inspected, cropped or resized, and exported to WebP for the Flutter bundle.

The Fusion F-Bean icon/splash concept and benefit/empty-state illustrations were drawn as deterministic flat SVG artwork after generated explorations were rejected for using effects that did not fit the project's no-gradient direction. The loading GIF was assembled from deterministic flat frames based on the same mark.

## Prompt Set

### Product mockups

Shared direction for the first three products:

> Create an original premium coffee-product studio mockup for Fusionify Coffee. Center one realistic takeaway drink on a transparent background, use a restrained white cup with a solid Fusionify blue brand band, clean commercial lighting, natural drink texture, no competitor marks, no extra props, no text beyond a small original Fusionify treatment, and no gradient graphic design.

Individual variants:
- Aren Latte: espresso and milk with a visible palm-sugar layer
- Sea Salt Latte: pale iced latte with a soft sea-salt cream cap
- Matcha Cloud: creamy green matcha with a light cloud-like foam cap

Shared direction for the expanded demo menu:

> Create an original square premium coffee product photograph for Fusionify Coffee, matching a cohesive catalog family with a solid warm-ivory studio background and a restrained blue cup band. Use realistic commercial lighting and drink texture, no readable copy, no competitor marks, and no gradient graphic design.

Individual variants:
- Buttercream Latte: layered iced espresso with a smooth pale buttercream cap
- Pandan Coconut Latte: fresh green pandan-coconut latte with creamy layers
- Chocolate Malt Cloud: iced chocolate malt with a light chocolate foam cap

### Signature Collection campaign

> Create an original 2:1 horizontal Fusionify Coffee campaign still featuring the three signature drinks on the right, warm off-white studio environment, restrained blue details, generous clean negative space on the left for localized app copy, premium but approachable commercial photography, no baked-in text, no logos from other brands, and no decorative gradients.

### Additional campaigns

- Morning Pickup: a 2:1 commercial still with a hot latte, croissant, and pickup bag on the right, clean left-side space, warm ivory and restrained Fusionify blue, no baked-in copy or third-party marks.
- Fusion Black Rewards: a 2:1 premium still with an original dark loyalty credential and espresso on the right, clean left-side space, subtle blue identity detail, no issuer, payment-network, chip, PAN, or copied card elements.

### Outlet preview

> Create an original photorealistic Indonesian urban coffee-shop interior using warm ivory walls, light oak, and restrained Fusionify blue. Keep it welcoming and operationally believable, with no people, no readable menu text, no competitor identity, and no decorative gradient treatment.

### Brand and utility artwork

- `fusion-f-bean-app-icon.svg`: flat blue icon tile with an ivory coffee-bean silhouette fused with an original letter F.
- `fusion-f-bean-mark.svg`: transparent flat mark for splash and light surfaces.
- `digital-benefits.svg`: flat coffee, Wi-Fi, and sparkle composition for the digital-benefit surface.
- `empty-cup.svg`: flat empty-cup illustration for no-content states.
- `fusion-f-bean-loading.gif`: nine-frame, lightweight pulse animation for in-app loading only.

### Membership backgrounds

Shared direction:

> Create an original straight-on 1.586:1 digital loyalty-card background for Fusionify Coffee. Use restrained premium material detail, a subtle abstract coffee-bean motif, clean empty areas for live UI text, no baked-in words, no portrait, no chip, no card number, no payment-network or issuer logo, no copied card design, and no decorative gradient composition.

Variants:
- Fusion Blue: solid brand-blue base with quiet tonal texture
- Fusion Silver: cool silver material with blue identity accents
- Fusion Gold: muted champagne-gold material with restrained blue accents
- Fusion Black: deep near-black material with an original abstract bean medallion and subtle blue detail

## Usage Boundary

- These are provisional development assets pending product/brand approval.
- The product images map to the six seeded preview products.
- The three campaign images and outlet image are bundled demo fallbacks.
- Product, campaign, and outlet records expose media URLs through the catalog API. Production media should use backend/CDN-managed HTTPS URLs; `asset://` references select known bundled demo fallbacks.
- Membership artwork is a loyalty background, not a payment card.
- The Fusion F-Bean concept must be replaced if a different official mark is approved.
