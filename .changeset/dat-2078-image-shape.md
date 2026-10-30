---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Draw a search hit's image in the merchant's shape (DAT-2078). `_display.image` is now `SearchDisplayImage`, `{ url, shape }` with `shape: SearchImageShape` (`'theme' | 'square' | 'rounded' | 'round'`), on product, collection, article and page hits; `hitImage`, `ProductHitDisplay.image` and `SectionHitDisplay.image` carry it whole. `DialogSearchProductCard` and `DialogSearchCollections` draw `image.url` with the theme's corners for `theme`, straight corners for `square`, 8px rounded corners for `rounded` and as a circle for `round`.

Requires a server that sends `_display.image` as `{ url, shape }` (DAT-2075): a string `_display.image` is no longer read. A custom card reads `display.image.url` instead of `display.image`.
