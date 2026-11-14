---
"@askdialog/dialog-sdk": minor
---

Facet counts, opt-in per controller (DEC-4129). `createSearchController` takes `facets` (default `false`; off, the requests and the behaviour are unchanged). On, in `lexical` mode, each products search sends a second request, at the same time as the hits', to `POST /public/search/lexical/facets` with the same query and filters, counting the attributes `connectDynamicWidgets` lists and `price`. The hits request is the same with the option on or off and renders without waiting for the counts; counts are asked once per query, filters and counted attributes, so a search changing any of them aborts both requests on their way while a page change sends the hits alone; a failed counts request leaves the hits and the uncounted values. The `ai` mode sends no counts. `facetsTransport` replaces the counts transport, otherwise bound to `apiKey` (`searchLexicalFacets`).

`results.facets` and `results.facetsStats` hold the last counts answered. `connectRefinementList` items carry `count` when they hold the attribute: a value with no result is no longer offered, a checked one stays with its count or 0, and the fold applies to the offered values; without counts every config value is offered without `count`, as before. `connectRange` exposes `bounds` (`{ min, max }`) on `price`. A draft shows its parent's counts and sends nothing.

New exports: `searchLexicalFacets` and the `SearchFacetCounts`, `SearchFacetsFunction`, `SearchFacetsOptions`, `SearchFacetsRequest`, `SearchFacetsResponse` and `SearchFacetStats` types. Requires dialog-ecom's facets route (DEC-4127) on the server it calls.
