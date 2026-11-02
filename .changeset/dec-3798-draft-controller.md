---
"@askdialog/dialog-sdk": minor
---

`controller.createDraft()` returns a `SearchDraft` (DEC-3798): a controller over a copy of the search state, sharing the parent's results and context, that sends no request. Connectors work on it as on a controller. `commit()` applies its search state to the parent in one search, `discard()` drops it; either ends the draft. `createSearchDraft(controller)` builds one over any `SearchController`, e.g. a wrapper.
