---
"@askdialog/dialog-sdk": patch
---

fix(sdk): call the monolith directly for product questions (DEC-2698)

`getSuggestions()` fetched `/ai/product-questions` on the core API Gateway, which has only relayed to the monolith since the route moved. It now calls `GET /public/product-page-questions` on `monolithApiUrl` — the same base as `dialog.search()` — with the `x-dialog-api-key` header, and `pagePath` is URL-encoded. `baseApiUrl` is removed from the config flavors: nothing in the SDK reaches the gateway anymore. The development flavor's `monolithApiUrl` is the staging custom domain (`https://api-staging.askdialog.ai`) instead of the raw execute-api URL.
