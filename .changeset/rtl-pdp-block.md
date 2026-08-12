---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.
