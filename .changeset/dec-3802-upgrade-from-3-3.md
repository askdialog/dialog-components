---
"@askdialog/dialog-sdk": minor
---

AI search connectors (DEC-3802): the AI mode, the AI Overview transport, refinements, the draft controller and their connectors. The lexical search behaves as in 3.3.0.

Upgrading from `@askdialog/dialog-sdk` 3.3.0 (`@askdialog/dialog-react` 3.3.0, `@askdialog/dialog-vue` 4.3.0):

- Upgrade the SDK with React: React 3.4.0's peer `@askdialog/dialog-sdk` is `^3.4.0`. Vue 4.3.1 needs SDK 3.3.0 or later and speaks the SDK's new languages.
- An object of your own typed `SearchController`, e.g. a wrapper, implements `createDraft()`: `createDraft: () => createSearchDraft(wrapper)`.
- A `SearchSnapshot` or `SearchContext` built by hand, e.g. a test fixture, sets `context.mode`: `"lexical"` for the search you had.
- A complete `SearchTexts` built by hand adds `filterFields`, `filterComparison`, `filterBetween`, `filterExclusion` and `filterValueRange`. The controller's `texts` option takes some of the texts and needs no change.
- Nothing else: `transport` is still accepted, now optional, and the lexical mode stays the default.
