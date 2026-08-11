---
"@askdialog/dialog-sdk": minor
---

New optional constructor flag `disableAddToCart` (type `boolean`, default `false`). When set, the SDK flags the injected assistant (via `data-disable-add-to-cart` on the mounted `#dialog-shopify-ai` div) so it hides the add-to-cart CTA on both product recommendation and conversational product cards, and `addToCart()` becomes a no-op — it never invokes the merchant `callbacks.addToCart` and emits no `TRACK_ADD_TO_CART` event, so a stale UI cannot add to the cart or pollute analytics. Product links and recommendation browsing are unaffected.

Context: merchants with a B2B flow that hides purchasing actions for logged-in B2B shoppers (e.g. Tikamoon) needed a per-session way to disable Dialog add-to-cart. Default behavior is unchanged for existing clients: omit the flag (or set it to `false`) and the add-to-cart CTA and analytics behave exactly as before.

```ts
new Dialog({
  apiKey,
  locale,
  disableAddToCart: true, // hide add-to-cart for this widget instance/session
})
```
