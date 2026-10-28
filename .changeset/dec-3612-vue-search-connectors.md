---
"@askdialog/dialog-vue": major
---

The search components run on the SDK's new search controller and connectors (`@askdialog/dialog-sdk/search`). `useDialogSearch` keeps its options and returns `{ controller, state, theme }`, where `controller` is the new `SearchController` and `state` a `ShallowRef` of its snapshot: read `state.value.results.status`, `state.value.results.products` and `state.value.context` instead of `state.value.status`, `state.value.response` and `state.value.businessRanking`. `DialogSearchBar`, `DialogSearchResults`, `DialogSearchPagination` and `DialogSearchProductCard` keep their props and rendering; `DialogSearchProductCard` takes an optional `display`.

Without a `locale` prop, texts and prices now follow the controller's `language` and `country` (previously English texts and the browser's number format); with one, they are formatted in that locale with the SDK's helpers. The business ranking is loaded by the controller at the first focus or search instead of on mount.

The peer `@askdialog/dialog-sdk` is 3.x, whose root exports the same search API.
