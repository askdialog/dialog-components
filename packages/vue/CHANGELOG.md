# @askdialog/dialog-vue

## 3.4.1

### Patch Changes

- d2c9824: Docs: add a package README for `@askdialog/dialog-vue` (install, components, storefront search, theming) and a features table of contents to both the Vue and React READMEs. Drop the unfinished License placeholder section from the React README.

## 3.4.0

### Minor Changes

- 33c44d3: feat(search): carry the storefront market on search requests and render market pricing

  `SearchRequest` gains optional `locale` (BCP 47) and `countryCode` (ISO 3166-1 alpha-2): the backend answers with localized product titles and the Shopify Market's prices. `createSearchController` accepts the same options and stamps them on every request; `dialog.search()` defaults them from the instance's `locale`/`countryCode`. `SearchProduct` gains an optional `compareAtPriceRange` (always in `priceRange`'s currency).

  React/Vue: `DialogSearchResults` (and the product card) accept an optional `locale` prop so prices format with the storefront's conventions instead of the browser's, and render the compare-at price struck through when it beats the displayed price. `useDialogSearch` accepts `locale`/`countryCode` and forwards them to the controller.

## 3.3.0

### Minor Changes

- 52fe8fd: Add the storefront search components: `useDialogSearch` (Vue binding of the SDK search controller) plus `DialogSearchBar`, `DialogSearchResults`, `DialogSearchProductCard` and `DialogSearchPagination`, with DEC-2448 attribution (viewport impressions and select events) wired in.

## 3.2.0

### Minor Changes

- 9e56f79: Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

  The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.

## 3.1.0

### Minor Changes

- 5eb504d: feat: register the wrapper package in window.dialog.audit (DEC-2368)

  `DialogProductBlock` now registers its integration (`react` / `vue`) and package version on the shared audit surface `window.dialog.audit` when it mounts, alongside the SDK's own entry — so support can tell a React/Vue integration apart from direct SDK usage from the browser console.

## 3.0.2

### Patch Changes

- 8b645e1: fix: widen the `@askdialog/dialog-sdk` peer dependency to `^2.0.1`

  The peer was pinned to the exact version `2.0.0`, so installing the latest
  `@askdialog/dialog-sdk@2.0.1` alongside `dialog-react`/`dialog-vue` produced a
  peer-dependency mismatch warning (and an `ERESOLVE` error under strict peer
  resolution). The peer is now a caret range (`^2.0.1`), accepting any compatible
  `2.x` SDK release.

## 3.0.1

### Patch Changes

- fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650). The `3.0.0` `latest` artifact shipped a stale `@askdialog/dialog-sdk@1.2.0` peer; this release ships the correct `2.0.x` peer metadata.

## 3.0.0

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0

## 3.0.0-beta.2

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0-beta.1

## 3.0.0-beta.1

### Patch Changes

- Updated dependencies [8b8c1a9]
  - @askdialog/dialog-sdk@1.2.0-beta.0

## 2.0.1-beta.0

### Patch Changes

- 02ecd59: fix(product-block): suppress English placeholder flash during suggestions fetch (OPS-589)

  `DialogProductBlock` no longer renders English default placeholders (`"Your expert"`, `"A question about this product?"`, `"Ask anything..."`) while `getSuggestions` is in flight. Title, description, and input placeholder render empty until the localized response arrives, eliminating the visible English → target-language re-render on multi-locale storefronts. Also hardens the fetch lifecycle: resets loading state on each `productId`/`client` change, clears loading in `finally` on errors, and guards against out-of-order responses overwriting newer data.

## 2.0.0

### Patch Changes

- 9200579: Setup changeset and monorepo
- Updated dependencies [354db6b]
- Updated dependencies [9200579]
  - @askdialog/dialog-sdk@1.1.0

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies [354db6b]
  - @askdialog/dialog-sdk@1.1.0-beta.3

## 1.0.24-beta.2

### Patch Changes

- 9200579: Setup changeset and monorepo
- Updated dependencies [9200579]
  - @askdialog/dialog-sdk@1.0.26-beta.2
