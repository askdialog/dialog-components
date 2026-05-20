# @askdialog/dialog-vue

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
