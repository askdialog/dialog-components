---
"@askdialog/dialog-sdk": minor
---

`registerSubmitCheckoutEvent` now accepts an order-level payload: the order total (`orderValue`) plus optional `currency`, `transactionId` and `items[]`, sent once per completed order. This is what the dashboard's "Revenue generated" reads.

The previous per-line signature (`{ productId, quantity, price }`) carried no order total, so revenue resolved to 0 for SDK-based integrations. It is now **deprecated but still accepted** — existing installs keep working after upgrading; migrate at your own pace.

```ts
// preferred — once per order, with the total
client.registerSubmitCheckoutEvent({
  orderValue: 59.98,
  currency: 'EUR',
  transactionId: 'ORDER-123',
  items: [{ productId, quantity, price, variantId }], // optional, attribution only
})

// still works (deprecated) — per line, no order total
client.registerSubmitCheckoutEvent({ productId, quantity, price, currency, variantId })
```

`registerAddToCartEvent` is unchanged.
