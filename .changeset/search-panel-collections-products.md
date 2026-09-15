---
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

`DialogSearchResults` now shows the same layout as the Shopify search overlay: a collections column next to the products (list or 3-column `layout="grid"`), the query match emphasized in every title, a "See all results" footer button when `seeAllHref` is set (pagination otherwise), and a mobile stack below 768px. The panel is centered on the bar (at least 720px wide, clamped to the viewport) and its palette, radii and font follow the SDK theme through the new `theme` prop. Labels come in en/fr/de/es/it from `locale`.

`useDialogSearch` accepts `sections` (e.g. `[{ index: 'collections', hitsPerPage: 5 }]`) to fill the collections column and returns the client's `theme`. `DialogSearchBar` is unchanged.
