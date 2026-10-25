---
"@askdialog/dialog-sdk": minor
---

New optional merchant callback `callbacks.getCart()`, through which the assistant reads the shopper's cart on storefronts it cannot read itself (e.g. headless). It resolves a `CartSnapshot` (exported) — `{ lines: { productId, variantId, quantity, unitPrice }[], totalAmount, currency }`, amounts in currency units, `totalAmount` after cart discounts and excluding shipping, ISO 4217 `currency` — or `null` when there is no cart. `Dialog.getCart()` forwards to it and `Dialog.canReadCart()` tells whether the callback was provided; without it existing integrations are unchanged. Being a read, it is not affected by `disableAddToCart`.

```ts
new Dialog({
  apiKey,
  locale,
  currency,
  callbacks: {
    addToCart,
    getProduct,
    getCart: async () => ({
      lines: [{ productId: "42", variantId: "4242", quantity: 2, unitPrice: 12.5 }],
      totalAmount: 25,
      currency: "EUR",
    }),
  },
})
```
