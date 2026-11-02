---
"@askdialog/dialog-sdk": minor
---

AI search in the search controller (DEC-3794). `createSearchController({ mode: "ai" })` searches `/public/search/ai`: products only, no request for a query under 2 characters, and `results.filters` (one block per source) and `results.attributeLabels` from the response. `transport` is now optional: without it, the mode's transport is bound to `apiKey`. New exports: the `searchAi` and `searchAiOverview` transports (API key header, abort signal, 30 s timeout, `DialogSearchError` on HTTP errors) and the `SearchMode`, `SearchFilterBlock` (a `SearchFilters` with its `source`), `SearchAttributeLabels`, `AiOverviewRequest`, `AiOverviewResponse` and `AiOverviewSuggestion` types. `SearchResult` gains the AI search's optional `filters` and `attributeLabels`.
