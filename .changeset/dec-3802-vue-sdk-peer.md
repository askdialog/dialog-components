---
"@askdialog/dialog-vue": patch
---

Vue's peer `@askdialog/dialog-sdk` is now `^3.3.0` (DEC-3802): since 4.3.0, Vue reads `titleParts` as `TitlePart[]` and calls `productHitDisplay(controller, hit)`, which SDK 3.1 and 3.2 do not provide. Upgrading from Vue 4.3.0: install SDK 3.3.0 or later with it.
