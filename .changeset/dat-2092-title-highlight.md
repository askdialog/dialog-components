---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Search titles bold what the engine matched (DAT-2092). Product, collection, article and page hits carry Algolia's optional `_highlightResult.title` (`SearchHighlightResult`: `value`, `matchLevel`, `matchedWords`, `fullyHighlighted`). `ProductHitDisplay.titleParts` and `SectionHitDisplay.titleParts` are now `readonly TitlePart[]`, runs of `{ text, highlighted }` split on the `<em>` of `value`, text unescaped; a hit without `_highlightResult` or with `matchLevel: none` gives one plain run. `highlightedTitleParts(title, highlightResult)` is exported.

Removed: `splitTitleMatch` and the `TitleParts` type; `productHitDisplay(controller, hit)` no longer takes a `query` or the deprecated `locale`. `DialogSearchProductCard` and `DialogSearchCollections` show the matched parts in bold and the rest in the normal text colour (no more muted parts); `DialogSearchProductCard` loses its `query` and deprecated `locale` props. Requires a server that sends `_highlightResult` (dialog-ecom DAT-2089); without it titles show plain.
