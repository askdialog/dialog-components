---
"@askdialog/dialog-sdk": minor
---

Export the `searchProducts` transport so search-only integrations (Shopify theme-embed autocomplete) can call `POST /public/search` without instantiating `Dialog`, whose constructor loads the assistant runtime.
