---
"@askdialog/dialog-sdk": minor
---

`AddToCartInput` accepts an optional `sellingPlanId`: the selling plan (subscription or pre-order) the shopper chose (DEC-4572). `dialog.addToCart` forwards it to `callbacks.addToCart` and to the `TRACK_ADD_TO_CART` event payload. It is absent for a one-time purchase, so an integration that ignores the field keeps working unchanged.
