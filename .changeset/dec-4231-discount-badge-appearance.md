---
"@askdialog/dialog-sdk": minor
---

The search appearance's discount badge style (DEC-4231). `SearchAppearance` gains `badges.discount`, with optional `background` and `text` hex colours and `radius` in whole pixels (0 to 999); a loaded or session-restored config keeps it, a malformed key being dropped on its own. `resolveSearchAppearanceVariables` returns `--dialog-search-discount-badge-background`, `--dialog-search-discount-badge-text` and `--dialog-search-discount-badge-radius` (`<n>px`) for each key set, and nothing for an absent one: the surface holds the default.
