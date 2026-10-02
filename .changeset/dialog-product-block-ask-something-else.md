---
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

`DialogProductBlock` renders no input by default: `enableInput` defaults to `false` and is deprecated. The block shows at most 2 product questions and an "Ask something else" button (English, French or Spanish depending on the client locale) that opens the assistant with up to 5 product questions about the product. Pass `enableInput` to keep the previous input instead of the button. Requires `@askdialog/dialog-sdk` 2.15.0 or later.
