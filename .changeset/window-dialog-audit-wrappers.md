---
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

feat: register the wrapper package in window.dialog.audit (DEC-2368)

`DialogProductBlock` now registers its integration (`react` / `vue`) and package version on the shared audit surface `window.dialog.audit` when it mounts, alongside the SDK's own entry — so support can tell a React/Vue integration apart from direct SDK usage from the browser console.
