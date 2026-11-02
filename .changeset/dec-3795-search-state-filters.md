---
"@askdialog/dialog-sdk": minor
---

The products entry of the search state takes `refinementList`, `range` and `filters` (DEC-3795), sent as the products request's `facetFilters` and `numericFilters`: OR within an attribute, AND across attributes, `range` bounds inclusive, `filters` as they are. Changing any of them resets the page to 0; a `refinementList` or `range` attribute the search config does not declare with the matching type is dropped; sections are never filtered. `SearchQuery` gains optional `facetFilters` and `numericFilters`; `SearchFacetFilter`, `SearchNumericFilter` and `SearchFilters` are exported.
