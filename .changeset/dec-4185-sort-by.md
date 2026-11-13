---
"@askdialog/dialog-sdk": minor
---

The shopper's sort (DEC-4185). A products entry of the search state takes `sort`: `relevance` (default, also when absent), `price_asc` or `price_desc`, by the product's lowest price in the market, the price its card shows. In `lexical` mode the products request carries `sort` when it is not relevance, so a controller that never sets one sends the same body as before; the `ai` mode never sends it, and the facet counts request neither carries it nor is sent again on a sort change. A sort change searches from page 1 with the query and filters kept, and a draft carries it until committed.

`connectSortBy(controller)` lists the three sorts with their labels in the shopper's language, the current one, the control's label (`sortLabel`) and `refine(sort)`. `SearchTexts` gain `sortLabel` and `sortOptions` in every language. With `routing`, the default URL format writes `sort=price_asc|price_desc`, leaves relevance out, and reads an unknown value as relevance; `SearchRouteState` gains `sort`.

New exports: `connectSortBy`, `SEARCH_SORTS` and the `SearchSort`, `SortByConnector`, `SortByItem` and `SortByRenderState` types. Requires dialog-ecom's `sort` on `POST /public/search/lexical` (DEC-4184) on the server it calls: before it, a price sort answers 400.
