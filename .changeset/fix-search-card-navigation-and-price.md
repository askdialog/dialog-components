---
"@askdialog/dialog-sdk": patch
"@askdialog/dialog-react": patch
---

Fix two issues in the DialogSearch storefront components (DEC-2455):

- **Double navigation.** When `useDialogSearch` is given a `navigate` router adapter, selecting a result card ran both the adapter's client-side transition and the anchor's native navigation, causing a duplicate transition / full-page reload. `SearchController.selectResult` now takes an optional `{ navigate }` and returns `true` when the adapter handled navigation; the React card `preventDefault()`s in that case. Modified clicks (cmd/ctrl/shift/alt) and middle-clicks pass `{ navigate: false }` so they still open a new tab natively — attribution is recorded but the in-app adapter (which can't open a tab) is skipped. Without an adapter, `selectResult` returns `false` and native `<a href>` navigation proceeds unchanged.
- **Price formatting crash.** A malformed `currencyCode` in untrusted catalog data made `Intl.NumberFormat` throw during render, which could take down the whole search results panel instead of dropping one price. `formatSearchPrice` now degrades to an empty string (no price shown) on a formatting error.
