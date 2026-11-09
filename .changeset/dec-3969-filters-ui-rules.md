---
"@askdialog/dialog-sdk": minor
---

Filter rules for a filters UI (DEC-3969), following InstantSearch:

- `connectRefinementList(controller, { attribute, limit })` folds the values past `limit`: it renders the first `limit` values in the search config's order and every checked one further down, in its place, and all of them when the fold would hide fewer than 2. The render state gains `isShowingMore`, `canToggleShowMore` and `foldedCount` (the values the fold hides, for "See more (n)"), and the connector gains `toggleShowMore()`. Without `limit`, every value shows, as before.
- `connectDynamicWidgets(controller)` renders `attributesToRender`: the keyword attributes with values, in the config's order, then `price` when declared as a number. Boolean, date and valueless attributes are left out, and so is one whose config entry carries `showInSearch: false`, a new optional field of `FilterableAttribute` (absent means shown).
- `connectClearRefinements(controller)` renders `canRefine`, true when the products request sends a value or a bound the visitor picked; `refine()` removes every refinement list and range in one search state change, keeping the query.
- A loaded search config gains the `price` number attribute, last, labelled with `texts.filterFields.price`, so a range on price is sent without the surface adding it. A `price` the config publishes gives way to it, its `showInSearch: false` kept; a config passed in with `config` is left as it is.
- `getSearchTexts` gains `seeMore(count)`, `seeLess`, `clearAll`, `clearFilters`, `filteredEmptyTitle`, `filteredEmptyBody`, `priceMin`, `priceMax`, `priceMinAboveMax`, `removeFilter(text)`, `filtersLabel` and `appliedFiltersLabel`, in every language it ships.
