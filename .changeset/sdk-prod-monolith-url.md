---
"@askdialog/dialog-sdk": patch
---

fix(sdk): point the production flavor at the real prod monolith (DEC-2453)

`monolithApiUrl` was baked to a raw execute-api gateway URL that answers 500 on every route; the production monolith is served on its custom domain `https://api.askdialog.ai` (the dashboard's `VITE_MONOLITH_API_URL`). `dialog.search()` in production was failing with a generic Internal Server Error.
