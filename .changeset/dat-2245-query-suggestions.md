---
"@askdialog/dialog-sdk": minor
---

Query suggestions (DAT-2245). A `sections` entry `{ index: 'query_suggestions' }` requests `query_suggestions_<lang>_<country>` with 5 hits unless its `hitsPerPage` says otherwise, on the empty query too, where it is the only section sent beside products. `results.sections.query_suggestions` carries its hits as `SearchQuerySuggestionHit` (`objectID`, `query`, `popularity`), in the order returned. `connectQuerySuggestions(controller)` lists them as `suggestions: { hit, parts }[]`, `parts` being the query in runs with the leading part matching the typed text `highlighted`, ignoring case and accents (none on the empty query), and `applySuggestion(query)` sets the query and searches it at once, without the debounce. `SearchResult`'s default hit type now includes `SearchQuerySuggestionHit`. New exports: `connectQuerySuggestions` and the `QuerySuggestion`, `QuerySuggestionsConnector`, `QuerySuggestionsRenderState` and `SearchQuerySuggestionHit` types.
