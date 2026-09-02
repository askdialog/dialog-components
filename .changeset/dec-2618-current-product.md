---
"@askdialog/dialog-sdk": minor
---

New optional constructor option `product` (`{ id: string; variantId?: string }`) and instance methods `setCurrentProduct(productId, variantId?)` / `clearCurrentProduct()` to declare the product of the current page. The SDK writes it as `data-product-id` / `data-variant-id` on the mounted `#dialog-shopify-ai` div; the assistant runtime uses it as the conversation's product context for entry points that carry no product of their own (floating bookmark, resume surface, free-text questions), so answers stay grounded on the PDP under the shopper's eyes after page-to-page navigation (DEC-2618).

Default behavior is unchanged: without the option the mount node carries no product keys and the assistant behaves as before.

```ts
new Dialog({
  apiKey,
  locale,
  product: { id: '6980' }, // the PDP's product id, per the Dialog feed
})
// SPA navigation:
client.setCurrentProduct('7001')
client.clearCurrentProduct()
```
