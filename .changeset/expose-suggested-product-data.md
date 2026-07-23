---
"@askdialog/dialog-sdk": minor
---

feat(sdk): expose enriched added-product data in add-to-cart surfaces (DEC-2336)

`Dialog.addToCart` / `registerAddToCartEvent` now accept optional enriched fields describing the product actually added to cart — `productTitle`, `variantTitle`, `productUrl` — plus the PDP-context product under `pageProductId` / `pageVariantId`. The full input is forwarded to the merchant `callbacks.addToCart` and to the `TRACK_ADD_TO_CART` event, and the `userAddedToCart` assistant event payload type declares the same fields.

This lets merchant analytics integrations (e.g. GA forwarding) track a Dialog-suggested product added from another product's PDP without resolving product data from the page context (which describes the visited PDP product, not the added one).

All new fields are optional: existing integrations and older assistant versions keep working unchanged.
