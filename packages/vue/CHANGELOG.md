# @askdialog/dialog-vue

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
