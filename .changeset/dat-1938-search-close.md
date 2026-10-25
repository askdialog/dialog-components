---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
---

Search controllers expose `close()`, the counterpart of `open()`: it cancels the pending debounced query and the in-flight request (a late response is ignored), emits impressions already qualified as `view_search_results`, stops observing result elements and resets the state to idle with an empty query, without sending a request. Call it when the shopper dismisses search instead of `setQuery('')`, which runs the empty-query search. The next `open()` runs the empty-query search again (DAT-1938).
