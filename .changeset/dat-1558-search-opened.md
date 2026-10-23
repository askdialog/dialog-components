---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

feat(sdk): search opened signal and snake_case `user_id` on search events (DAT-1558)

The search controller gets `open()`, which emits a new `DialogEvents.TRACK_OPENED_SEARCH` Dialog event carrying `user_id`, `surface` and `search_type`. Call it when the search input gets focus; it fires on every focus, deduplication happens downstream.

`TRACK_VIEW_SEARCH_RESULTS` and `TRACK_SELECT_SEARCH_RESULT` now carry `user_id`. Their `userId` stays next to it for this version and is deprecated: read `user_id` instead, `userId` is removed in the next version.

New: `Dialog.trackOpenedSearch(params)`, the optional `trackOpenedSearch` callback on `SearchControllerAnalytics` (existing custom adapters keep compiling), and the `OpenedSearchParams` / `OpenedSearchEventPayload` types. The React and Vue `DialogSearchBar` and the raw JavaScript demo (`packages/search-example`) call `open()` on input focus.
