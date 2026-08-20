---
"@askdialog/dialog-sdk": patch
---

Add the optional `handle` field to `SearchProduct`, so Shopify storefronts can build `/products/{handle}` links when the indexed document carries no `url` (DEC-2543).
