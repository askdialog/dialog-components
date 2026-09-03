---
"@askdialog/dialog-sdk": major
"@askdialog/dialog-react": major
"@askdialog/dialog-vue": major
---

feat!: Algolia-shaped public search — the index name carries the locale (DAT-412)

The public search wire now mirrors Algolia's "search multiple indices" contract on `POST /public/search/lexical`. One breaking change across the SDK and both bindings:

- **Request**: `{ requests: [{ indexName, query, page?, hitsPerPage? }] }`. The locale travels in the index name (`products_fr`, built with the new `searchIndexName(index, locale)` export) — `locale`, `countryCode` and the `queryId` resend leave the wire. Every entry is validated strictly server-side (unknown field → 400 `Unknown parameter`; unknown index or unserved locale → 404 `Index … does not exist`).
- **Response**: `{ results: [{ index, hits, nbHits, page, nbPages, hitsPerPage, processingTimeMS, query, queryID }] }`. Hits are flat records — `objectID` (the Shopify GID) plus the card attributes (`title`, `url`, `handle`, `imageUrl`, `priceRange`, `compareAtPriceRange`, `inStock`); the `SearchHit.product` wrapper, `id`, `score` and the `SearchProduct` type are gone. `queryID` is always returned, one per entry (`clickAnalytics` gating deferred).
- **Transport**: `searchProducts` is renamed `searchLexical` (the route is `search/lexical`, our one deliberate divergence from Algolia, keeping room for a future AI search); `dialog.search()` passes the request through untouched (the `Dialog` instance keeps `countryCode` for its own price formatting only).
- **Search controller**: requires `locale` (React/Vue `useDialogSearch` default it to the client's), searches `products_<locale>`, and exposes the products result entry as `state.response`. Each request — pagination included — is its own query: no `queryId` resend, the analytics `query_id` comes from the result's `queryID` and the DEC-2448 envelope gains the `index` it was served from (the Algolia Insights click tuple `(index, queryID, objectID, position)`).
- **React/Vue DialogSearch**: results and product cards read the flat hits; `useDialogSearch` drops `countryCode`.
