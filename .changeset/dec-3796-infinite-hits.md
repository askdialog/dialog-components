---
"@askdialog/dialog-sdk": minor
---

`connectInfiniteHits(controller)` stacks every page of products fetched so far (DEC-3796), for an infinite scroll: `hits` in page order, `nbHits` (the engine's total, kept while the next page loads), `isLastPage`, `loadingMore` and `failedMore`; `showMore()` requests the next page (ignored while loading, on the last page or with a query pending) and `retryMore()` replays the page that failed. A search starting over at page 0 (new query, other refinements, retry) drops the fetched pages from its first frame. On the `ai` mode, hits come raw as `{ hit }`, with no `display`, since AI hits carry no `_display`. The controller's `context` gains `mode`.
