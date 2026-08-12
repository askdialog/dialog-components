---
"@askdialog/dialog-sdk": patch
---

Set `data-ot-ignore` on the assistant script BEFORE assigning `src`, so the `ignoreOneTrustAutoBlock` flag actually works.

OneTrust's `OtAutoBlock.js` patches `document.createElement` and traps the `src` property setter of dynamically created scripts: the `hasAttribute("data-ot-ignore")` check runs synchronously at the moment `src` is assigned, and a blocked script is rewritten to `type="text/plain"` on the spot — never re-evaluated. The attribute was previously set one line after `src`, so it landed too late: the script ended up carrying `data-ot-ignore` in the DOM while already neutralized for visitors who declined cookies.
