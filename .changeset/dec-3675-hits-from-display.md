---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Search connectors draw what they display from the server's `_display` alone (DEC-3675): title, link, image, prices and display lines. `SearchHitDisplay` gains `title` and `url`; product hits carry `SearchProductHitDisplay`, which adds `price`, `compare_at_price?` (formatted in the shopper's market currency) and `lines` (`SearchDisplayLine`). `ProductHitDisplay` reads `price` and `compareAtPrice` from it and adds `lineAboveTitle` and `lineBelowTitle`; `productHitDisplay` ignores its now deprecated `locale` parameter. `connectSections` leaves out a collection, article or page whose link does not resolve, so `SectionHitDisplay.href` is always set.

A new controller option, `storefrontRoot` (default `/`, e.g. Shopify's `window.Shopify.routes.root`), is the path a relative `_display.url` resolves under, exposed as `context.storefrontRoot`; a relative link that leaves the storefront's origin, or a non-HTTP(S) one, is dropped. `useDialogSearch` passes it through in React and Vue. `buildProductUrl` is deprecated and ignored, and so is the `locale` prop of `DialogSearchProductCard`: prices are formatted by the server.

Upgrading from `@askdialog/dialog-sdk` 3.0.0 (`@askdialog/dialog-react` 3.0.0, `@askdialog/dialog-vue` 4.0.0):

- Search against a server that sends `_display.title`, `url` and the product prices. A hit without `_display` makes the connectors and the display helpers (`hitTitle`, `hitImage`, `hitHref`) throw, so a custom `transport`, and any hit built by hand, must return it.
- Pass `storefrontRoot` when the storefront runs under a path, e.g. `/fr-fr/`: relative links resolve under `/` otherwise.
- Remove `buildProductUrl`: links are `_display.url` alone, and a product hit whose link is dropped has no `href`.
- Remove the `locale` argument of `productHitDisplay` and the `locale` prop of `DialogSearchProductCard`: prices no longer follow them.
- Upgrade the SDK with React or Vue: their peer `@askdialog/dialog-sdk` is now `^3.1.0`, as Vue imports `productHitDisplay` from it.
- Check any custom CSS on the search cards: a hit with no image to display no longer renders a thumbnail slot, and its title and price take the slot's place.
