---
"@askdialog/dialog-react": major
---

Storefront search runs on the SDK's new search API (`@askdialog/dialog-sdk/search`). `DialogSearchBar`, `DialogSearchResults`, `DialogSearchPagination` and `DialogSearchProductCard` keep their props and rendering, built on the SDK's search box, hits, sections and pagination connectors; React's own copies of the search texts, display, highlight, theme and collection rules are removed.

Breaking changes:

- `useDialogSearch` keeps its options but returns the new controller and its snapshot: `controller.setQuery`, `submit`, `setPage` and `getState` are replaced by `setSearchState`, `search` and `getSnapshot`; `state` is `{ searchState, results, context }` (`state.results.status`, `state.results.products`, `state.context.businessRanking`) instead of the flat `{ status, query, page, response, sections, businessRanking }`.
- Without a `locale` prop, texts and prices follow the search `language` and `country` instead of English and the browser's number format. With one, they are formatted in that locale with the SDK's helpers.
