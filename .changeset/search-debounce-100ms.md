---
"@askdialog/dialog-sdk": patch
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

`createSearchController()` and `useDialogSearch` debounce keystrokes for 100 ms by default instead of 250 ms. Pass `debounceMs` to keep the previous delay.
