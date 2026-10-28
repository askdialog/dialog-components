---
"@askdialog/dialog-sdk": major
---

The root of `@askdialog/dialog-sdk` exports the new search API: `createSearchController`, the `connectSearchBox`, `connectHits`, `connectStats`, `connectPagination` and `connectSections` connectors, their types, and the search texts, display, highlight, price and theme helpers. `@askdialog/dialog-sdk/search` stays as an alias of the same exports. The legacy search controller is removed.

Breaking changes:

- `createSearchController` is the new controller. Its options keep `language`, `country`, `analytics`, `navigate`, `buildProductUrl`, `debounceMs`, `hitsPerPage` and `sections`; `search` is renamed `transport`. New optional options: `apiKey` (loads the business ranking and filterable attributes once per page), `config` (the merchant config when you already have it), `texts` (overrides of the default texts) and `initialSearchState`.
- The `SearchControllerState` type is removed, and `SearchController` and `SearchControllerOptions` now describe the new controller.

Migrating from the legacy controller, where `indexName` is the products index, e.g. `products_fr_be` (`searchIndexName('products', language, country)`):

| Legacy                                                              | New                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSearchController({ search, ... })`                           | `createSearchController({ transport: search, ... })`                                                                                                                                                 |
| `getState()` → `{ status, query, page, response, sections, error }` | `getSnapshot()` → `{ searchState, results, context }`: `results.status`, `searchState[indexName].query`, `searchState[indexName].page ?? 0`, `results.products`, `results.sections`, `results.error` |
| `subscribe((state) => …)`                                           | `subscribe((snapshot) => …)`, called with each new snapshot                                                                                                                                          |
| `setQuery(query)` (debounced)                                       | `setSearchState((state) => ({ ...state, [indexName]: { query } }))`, or `connectSearchBox(controller).refine(query)`                                                                                 |
| `submit(query)` (immediate)                                         | `setSearchState(…)` then `search()`, or `connectSearchBox(controller).submit(query)`                                                                                                                 |
| `setPage(page)`                                                     | `setSearchState((state) => ({ ...state, [indexName]: { ...state[indexName], page } }))`, or `connectPagination(controller).refine(page)`                                                             |
| `observeResult(element, index)`                                     | `observeHit(element, index)`, or `connectHits(controller).observe(element, index)`                                                                                                                   |
| `selectResult(index, options)`                                      | `selectHit(index, options)`, or `connectHits(controller).select(index, options)`                                                                                                                     |
| `open()`, `close()`, `retry()`, `productUrl(hit)`, `dispose()`      | Unchanged                                                                                                                                                                                            |

Any search state change other than the page resets the page to 0; a query change is sent after the debounce, any other change at once. The connectors also return ready-to-render hits (`display`: title, highlighted title parts, link, image, prices) and the default texts in the shopper's language; see the SDK README.
