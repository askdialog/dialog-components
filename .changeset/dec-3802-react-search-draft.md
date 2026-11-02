---
"@askdialog/dialog-react": minor
---

The controller `useDialogSearch` returns has `createDraft()` (DEC-3798), built over the hook's controller so a draft follows its recreation and does nothing once it is disposed. React's peer `@askdialog/dialog-sdk` is now `^3.4.0`, the first version with `createSearchDraft`.
