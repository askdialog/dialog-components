---
"@askdialog/dialog-sdk": minor
---

Add `connectAiOverview` (DEC-3800). `connectAiOverview(controller, { apiKey } | { transport })` requests the AI Overview once page 0 of an AI search answers, with its query, filters, hit count and first 3 object IDs, keeps it while later pages load, and exposes `status`, `text`, `suggestions` and `attributeLabels`; a failed page 0 fails it. A request is sent once per page and transport. `applySuggestion(suggestion)` replaces every filter of the search state with the suggestion's in one search, as `refinementList`, `range` and `filters`. New exports: the `AiOverviewConnector`, `AiOverviewParams`, `AiOverviewRenderState`, `AiOverviewStatus` and `AiOverviewTransport` types.
