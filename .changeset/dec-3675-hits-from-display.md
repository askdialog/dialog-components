---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Search connectors draw what they display from the server's `_display` alone (DEC-3675): title, link, image, prices and display lines. `SearchHitDisplay` gains `title` and `url`; product hits carry `SearchProductHitDisplay`, which adds `price`, `compare_at_price?` (formatted in the shopper's market currency) and `lines` (`SearchDisplayLine`). `ProductHitDisplay` reads `price` and `compareAtPrice` from it and adds `lineAboveTitle` and `lineBelowTitle`; `productHitDisplay` drops its `locale` parameter. `connectSections` leaves out a collection, article or page whose link does not resolve, so `SectionHitDisplay.href` is always set.

A new controller option, `storefrontRoot` (default `/`, e.g. Shopify's `window.Shopify.routes.root`), is the path a relative `_display.url` resolves under, exposed as `context.storefrontRoot`; a relative link that leaves the storefront's origin, or a non-HTTP(S) one, is dropped. `useDialogSearch` passes it through in React and Vue. `buildProductUrl` is deprecated and ignored, and so is the `locale` prop of `DialogSearchProductCard`: prices are formatted by the server.

Requires a server that sends `_display.title`, `url` and the product prices: use this version only once that monolith is in production.
