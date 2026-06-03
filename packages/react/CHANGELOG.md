# @askdialog/dialog-react

## 2.0.1-beta.0

### Patch Changes

- 667cc6f: fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650)

  The published `@askdialog/dialog-react@2.0.0` and `@askdialog/dialog-vue@3.0.0`
  `latest` artifacts shipped a stale `@askdialog/dialog-sdk@1.2.0` peer dependency,
  which made a clean install alongside `@askdialog/dialog-sdk@2.0.0` fail without
  `--legacy-peer-deps`. The repository source already requires the `2.0.0` line;
  the mismatch was introduced at pack time during the beta → production transition.

  npm versions are immutable, so this cuts fresh patch releases (`2.0.1` / `3.0.1`)
  with correct metadata. A publish-pipeline guard now inspects the packed tarball
  before publishing to prevent the same drift from recurring.

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
