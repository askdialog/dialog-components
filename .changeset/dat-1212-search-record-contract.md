---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Search follows the lexical search contract (DAT-1212). Index names carry the shopper's ISO 3166-1 alpha-2 country instead of the currency (`searchIndexName('products', 'fr', 'BE')` gives `products_fr_be`), and `createSearchController` and the React/Vue `useDialogSearch` take `country` in place of `currency`. Product hits are the exported `SearchProductHit`, Algolia's Shopify record plus `url` and `currency`, with `objectID` the variant id and `id` the product id; collection, article and page hits keep `SearchHit`. View and select events send the hit's `id` as `product_id`, and impressions are deduplicated on it.
