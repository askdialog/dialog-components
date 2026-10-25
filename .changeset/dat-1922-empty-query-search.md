---
"@askdialog/dialog-sdk": minor
---

feat(sdk): empty-query search on open (DAT-1922)

`open()` on the search controller now runs a products-only search with `query: ""` when no query was typed yet; its results land in the state with `query: ""`, which tells them apart from typed-query results. Queries no longer need two characters: one character searches after the usual debounce, and clearing the input runs the empty-query search again instead of resetting to `idle`. Impressions and clicks of the empty-query results are tracked like typed results, with `query_length: 0`. The React and Vue search bars therefore show the empty-query products as soon as the input gets focus.
