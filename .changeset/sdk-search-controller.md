---
"@askdialog/dialog-sdk": minor
---

feat(sdk): add the framework-agnostic search controller `createSearchController()` (DEC-2459)

Stateful search behavior around the stateless `dialog.search()` transport, shared by all integrations (raw JavaScript, React, Vue, Shopify): debounce with immediate explicit submission (`setQuery`/`submit`), cancellation of the in-flight request, stale-response protection via a request generation id (a late response never replaces newer results, even when transport cancellation is ignored), pagination that resets on a new query (`setPage`), subscribable `idle`/`loading`/`success`/`empty`/`error` states (`subscribe`/`getState`), `retry` and `dispose`.

The controller also owns the DEC-2448 attribution: viewport impressions through `observeResult(element, index)`, click attribution through `selectResult(index)` (forced impression + `select_search_result`) recorded before handing navigation to the optional `navigate` adapter, the zero-items `view_search_results` on a no-results state, and a `query_id` that stays stable while the query text is unchanged.

New exports: `createSearchController`, `SearchStatus` and the `SearchController*` types. The raw JavaScript demo (`packages/search-example`) now runs entirely on the shared controller.
