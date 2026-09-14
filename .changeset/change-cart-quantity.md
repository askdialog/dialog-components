---
"@askdialog/dialog-sdk": minor
---

New optional merchant callback `callbacks.changeCartQuantity({ productId, variantId, quantity })`, called by the assistant when the shopper adjusts the quantity of a line it just added (`quantity` is the new absolute quantity of that line, never a delta). `Dialog.changeCartQuantity(input)` forwards to it and `Dialog.canChangeCartQuantity()` tells whether the callback was provided; without it the assistant keeps hiding its quantity stepper, so existing integrations are unchanged. Both respect `disableAddToCart`.

```ts
new Dialog({
  apiKey,
  locale,
  currency,
  callbacks: {
    addToCart: async ({ productId, variantId, quantity }) => { /* add the line */ },
    changeCartQuantity: async ({ productId, variantId, quantity }) => { /* set the line to `quantity` */ },
    getProduct,
  },
})
```
