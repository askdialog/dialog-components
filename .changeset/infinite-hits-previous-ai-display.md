---
"@askdialog/dialog-sdk": minor
---

`connectInfiniteHits` adds `showPrevious()`, `isFirstPage`, `loadingPrevious`, `nbHitsBefore` and `nbHitsAfter`: a list restored on a later page (a URL's `page`) can load the pages above it, and its counts no longer assume it starts on page 0. On the `ai` mode, whose hits carry no `_display`, each hit gets a `display` built from its record (title, image, price range, `url` or `products/<handle>` link). `SearchAiProductHit` types those records. New `seePrevious` search text in every language.
