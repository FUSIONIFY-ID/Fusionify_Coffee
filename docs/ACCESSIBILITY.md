# Customer Accessibility

Fusionify Coffee treats accessibility as a release requirement for the customer application. The current repository includes an automated semantics baseline, but it is not a certification and does not replace device testing with assistive technology.

## Implemented Baseline

- Product cards expose one concise localized button label containing the product name, meaningful badge, and price.
- Cart buttons announce the current item count.
- Quantity controls have localized increase/decrease labels and a live quantity value.
- Password visibility and favorite actions describe the action they will perform.
- Outlet and fulfillment cards expose their selection, availability, and tap behavior without repeating decorative image content.
- Membership credentials expose tier, member, and progress copy as one semantic element.
- Loading states announce progress and replace animated brand media with a static brand mark when reduced motion is requested.
- Campaign indicators and membership transitions stop animating when reduced motion is requested.
- The compact outlet selector uses the minimum 48 dp interaction height.

Widget tests cover the core product-card label, localized password action, cart quantity announcement, and reduced-motion loading behavior.

## Manual Release Review

Run this review on an Android API 28 device/profile, an Android API 36 device/profile, and the supported iOS target once the deployment target is finalized.

### TalkBack and VoiceOver

1. Complete login, outlet selection, menu search, product customization, cart, checkout, QRIS payment, order tracking, rewards, and account flows.
2. Confirm focus order follows the visual reading order and never becomes trapped.
3. Confirm every actionable icon has a useful localized name and state.
4. Confirm product, price, quantity, payment, and order-status announcements are understandable without looking at the screen.
5. Confirm decorative images and repeated text are not announced as duplicate controls.

### Display and Input

1. Test the largest supported system text and display-size settings without clipped actions or unreachable content.
2. Test portrait, landscape, tablet/foldable width, and Android gesture navigation.
3. Test reduced motion and confirm no nonessential animated content remains.
4. Test external keyboard traversal where supported and verify visible focus.
5. Review contrast for text, icons, borders, disabled states, status chips, membership artwork, and QRIS instructions.

## Evidence

Record the app commit, build identifier, device/OS, locale, assistive-technology settings, flow tested, result, and any linked issue. Use `PASS`, `FAIL`, or `NOT RUN`; do not infer a pass from automated tests alone.
