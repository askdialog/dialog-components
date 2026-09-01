---
"@askdialog/dialog-sdk": patch
---

Search requests now send the locale as its bare ISO 639-1 language (`fr-FR` -> `fr`), whatever tag the caller holds. The search backend keys its indexes on the bare language, so a region-tagged locale no longer reaches the wire. Applies to every search path: `dialog.search()`, the search controller, and the standalone `searchProducts` transport. An unparsable locale is sent as-is.
