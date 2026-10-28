---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

Display a search hit's image from `_display` (DAT-2017). Product, collection, article and page hits carry `_display: SearchHitDisplay` (`{ image?: string }`), what to display computed by the server on top of the raw record; `hitImage` and the sections connector's `display.image` are `_display.image`, none when absent from it. `DialogSearchProductCard` and `DialogSearchCollections` render a hit with no image to display with no thumbnail slot: the title (and the price, for a product) alone.

Requires a server that sends `_display` (DAT-2016): use this version only once the monolith sending it is in production.
