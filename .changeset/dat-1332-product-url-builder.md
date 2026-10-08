---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Search takes an optional `buildProductUrl(hit)` (DAT-1332): React and Vue cards link to the hit's `url`, else to the builder's result, and have no link with neither. `controller.productUrl(hit)` gives that link, and `navigate` receives it.
