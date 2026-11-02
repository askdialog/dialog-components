---
"@askdialog/dialog-sdk": minor
---

Add `connectCurrentRefinements` (DEC-3799): one chip per filter group the products search sent, labelled with the attribute's published label else its default one, its values and the whole group written in the controller's language, prices in the new `currency` option (also in the context). On the `ai` mode the groups the engine detected come first, read-only; an exclusion or a group mixing attributes is read-only too. `remove(chip)` takes any other chip's filter off the search state. The search texts gain the filter labels and phrasings in every language (`filterFields`, `filterComparison`, `filterBetween`, `filterExclusion`, `filterValueRange`); `SearchNumericOperator` and `SearchFilterField` are exported.
