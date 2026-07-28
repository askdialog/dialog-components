---
"@askdialog/dialog-sdk": minor
---

feat(sdk): add typed `dialog.search()` and make commerce callbacks optional (DEC-2447)

New `dialog.search(request, options?)` method: a typed product search through the Nest public endpoint (`POST /public/search`). Stateless one-POST-per-call — no debounce, cache or retry; the caller owns cancellation through `options.signal`. Returns the Algolia-shaped envelope (`queryId`, `hits[].product` cards with title/image/priceRange/inStock, pagination) and throws a `DialogSearchError` carrying `status` and `code` on failure. New exports: `DialogSearchError` and the `SearchRequest`/`SearchResponse`/`SearchOptions` types.

Commerce callbacks (`addToCart`, …) are now optional at construction, so search-only integrations can do `new Dialog({ apiKey, locale })` without wiring cart handlers; commerce entry points throw a descriptive error if invoked without them.
