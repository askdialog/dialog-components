---
"@askdialog/dialog-react": major
"@askdialog/dialog-vue": major
---

`DialogSearchResults` no longer paginates. Without `seeAllHref`, the panel shows the first page of hits only, with no "Previous / Page x / y / Next" controls, as the Shopify theme's search overlay does; with `seeAllHref`, it still shows the "See all N results" link. `DialogSearchPagination` stays exported, for a results page of your own.
