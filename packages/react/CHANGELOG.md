# @askdialog/dialog-react

## 2.2.0

### Minor Changes

- 42aea98: Add the storefront search components: `useDialogSearch` (React binding of the SDK search controller) plus `DialogSearchBar`, `DialogSearchResults`, `DialogSearchProductCard` and `DialogSearchPagination`, with DEC-2448 attribution (viewport impressions and select events) wired in.
- 9e56f79: Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

  The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.

### Patch Changes

- 3715e6d: Fix two issues in the DialogSearch storefront components (DEC-2455):
  - **Double navigation.** When `useDialogSearch` is given a `navigate` router adapter, selecting a result card ran both the adapter's client-side transition and the anchor's native navigation, causing a duplicate transition / full-page reload. `SearchController.selectResult` now takes an optional `{ navigate }` and returns `true` when the adapter handled navigation; the React card `preventDefault()`s in that case. Modified clicks (cmd/ctrl/shift/alt) and middle-clicks pass `{ navigate: false }` so they still open a new tab natively — attribution is recorded but the in-app adapter (which can't open a tab) is skipped. Without an adapter, `selectResult` returns `false` and native `<a href>` navigation proceeds unchanged.
  - **Price formatting crash.** A malformed `currencyCode` in untrusted catalog data made `Intl.NumberFormat` throw during render, which could take down the whole search results panel instead of dropping one price. `formatSearchPrice` now degrades to an empty string (no price shown) on a formatting error.

## 2.1.0

### Minor Changes

- 5eb504d: feat: register the wrapper package in window.dialog.audit (DEC-2368)

  `DialogProductBlock` now registers its integration (`react` / `vue`) and package version on the shared audit surface `window.dialog.audit` when it mounts, alongside the SDK's own entry — so support can tell a React/Vue integration apart from direct SDK usage from the browser console.

## 2.0.2

### Patch Changes

- 8b645e1: fix: widen the `@askdialog/dialog-sdk` peer dependency to `^2.0.1`

  The peer was pinned to the exact version `2.0.0`, so installing the latest
  `@askdialog/dialog-sdk@2.0.1` alongside `dialog-react`/`dialog-vue` produced a
  peer-dependency mismatch warning (and an `ERESOLVE` error under strict peer
  resolution). The peer is now a caret range (`^2.0.1`), accepting any compatible
  `2.x` SDK release.

## 2.0.1

### Patch Changes

- fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650). The `2.0.0` `latest` artifact shipped a stale `@askdialog/dialog-sdk@1.2.0` peer; this release ships the correct `2.0.x` peer metadata.

## 2.0.0

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0-beta.1

## 2.0.0-beta.1

### Patch Changes

- Updated dependencies [8b8c1a9]
  - @askdialog/dialog-sdk@1.2.0-beta.0

## 1.0.1-beta.0

### Patch Changes

- 02ecd59: fix(product-block): suppress English placeholder flash during suggestions fetch (OPS-589)

  `DialogProductBlock` no longer renders English default placeholders (`"Your expert"`, `"A question about this product?"`, `"Ask anything..."`) while `getSuggestions` is in flight. Title, description, and input placeholder render empty until the localized response arrives, eliminating the visible English → target-language re-render on multi-locale storefronts. Also hardens the fetch lifecycle: resets loading state on each `productId`/`client` change, clears loading in `finally` on errors, and guards against out-of-order responses overwriting newer data.

## 1.0.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib
- Updated dependencies [354db6b]
- Updated dependencies [9200579]
  - @askdialog/dialog-sdk@1.1.0

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies [354db6b]
  - @askdialog/dialog-sdk@1.1.0-beta.3

## 0.1.1-beta.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib

## 0.1.0

### Minor Changes

- Initial release of React component library for Dialog AI-powered product assistance
- DialogProductBlock component with suggestions and input
- DialogInput standalone component
- Theme support via CSS variables
- TypeScript support with full type definitions
- React 19 support

### Dependencies

- @askdialog/dialog-sdk@^1.0.0
