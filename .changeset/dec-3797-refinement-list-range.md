---
"@askdialog/dialog-sdk": minor
---

Add `connectRefinementList` and `connectRange` (DEC-3797). `connectRefinementList(controller, { attribute })` lists the search config's values of the attribute with their checked state: the visitor's values in `refinementList`, else, on the `ai` mode, the ones the engine detected in the query (`results.filters`, source `query_constructor`); `refine(value)` toggles a value. `connectRange(controller, { attribute })` exposes the floor and ceiling as free text fields with a `minAboveMax` error; `refine(min, max)` writes `range`, an empty field removing its bound.
