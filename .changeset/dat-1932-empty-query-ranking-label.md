---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

feat: title the empty-query products after the business ranking (DAT-1932)

The SDK gets `client.getDialogConfig()`, which reads the widget dialog config; its `searchBusinessRanking` is the merchant's business ranking criterion (`best_sellers`, `newest`, `price_asc`, `price_desc`, absent when none). `useDialogSearch` in React and Vue reads it once per search bar and adds it to the state it returns, as `businessRanking`; `DialogSearchResults` then titles the products shown before any query is typed "Best sellers", "New arrivals", "Low prices", "High prices", or "Our products" without a criterion, in every locale the bars support, with no change to the integration. Typed-query results keep the "Products" title.
