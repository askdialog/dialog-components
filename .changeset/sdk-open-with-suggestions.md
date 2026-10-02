---
"@askdialog/dialog-sdk": minor
---

Open the assistant on a list of suggested questions, optionally about a product, with `openAssistantWithSuggestions`. `getSuggestions` accepts an optional `limit` (1 to 5) to fetch more than the default 2 product questions:

```ts
const { questions } = await client.getSuggestions(productId, { limit: 5 })
client.openAssistantWithSuggestions({
  questions,
  product: { id: productId, title, handle, selectedVariantId },
})
```
