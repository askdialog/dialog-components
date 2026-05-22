# @askdialog/dialog-react

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
