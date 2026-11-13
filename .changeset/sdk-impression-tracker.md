---
"@askdialog/dialog-sdk": minor
---

Impression tracker. `createImpressionTracker({ onImpressions })` reports each observed item once it is at least 50 % visible for 1 continuous second, once per item and per context (`reset()`), in batches of item ids sent on idle, at 100 items, on `flush()`, `reset()`, `disconnect()` and on pagehide; `record(itemId)` counts an item without waiting for visibility. The rule takes no option: only the sending is tunable (`idleFlushMs`, `maxItemsPerBatch`). It is exported by the SDK root and by `@askdialog/dialog-sdk/impressions`, which loads nothing else. New exports: `createImpressionTracker` and the `ImpressionTracker` and `ImpressionTrackerOptions` types. The search tracks its result views with it: a result now counts after 1 s visible instead of 500 ms, and `createSearchImpressionTracker` no longer accepts the `visibilityThreshold` and `dwellMs` options; the `view_search_results` events are otherwise unchanged.
