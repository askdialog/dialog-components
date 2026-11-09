---
"@askdialog/dialog-sdk": minor
---

Add the `routing` option of `createSearchController` (DEC-3970). `routing: true` starts the products entry from the URL and keeps it there: `q`, `page` (1-indexed, absent on page 1), `f.<attribute>=<value>` per value and `price=<min>:<max>`, the other params kept. A filter or page change pushes a history entry, a query change replaces it, and back and forward restore the query, the filters and the page without pushing one. Attributes the search config does not declare and a malformed `price` are ignored. `routing: { createURL, parseURL }` writes another URL format.
