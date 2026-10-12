---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

feat(sdk): search opened signal (DAT-1558)

The search controller gets `open()`, which emits a new `DialogEvents.TRACK_OPENED_SEARCH` Dialog event with the search envelope that exists before any result: `surface`, `search_type`, `userId`, and `query_id` when results from an earlier query are still on screen. Call it when the search input gets focus; it fires on every focus, deduplication happens downstream.

New: `Dialog.trackOpenedSearch(params)`, the optional `trackOpenedSearch` callback on `SearchControllerAnalytics` (existing custom adapters keep compiling), and the `OpenedSearchParams` / `OpenedSearchEventPayload` types. The React and Vue `DialogSearchBar` and the raw JavaScript demo (`packages/search-example`) call `open()` on input focus.
