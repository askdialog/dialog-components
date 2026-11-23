---
"@askdialog/dialog-sdk": minor
---

`connectInfiniteHits` adds `showPrevious()`, `isFirstPage`, `loadingPrevious`, `nbHitsBefore` and `nbHitsAfter`: a list restored on a later page (a URL's `page`) can load the pages above it, and its counts no longer assume it starts on page 0. AI hits now get a `display` built from their record (title, image, price range, `url` or `products/<handle>` link). New `seePrevious` search text in every language.
