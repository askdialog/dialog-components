---
"@askdialog/dialog-sdk": patch
---

The loaded merchant config reaches the controller's context as soon as the shared load answers, as in 3.7.0 (DEC-4130). In 3.7.1 it arrived a few microtasks later, so code that awaited the same load (`loadMerchantConfig`) and then read `getSnapshot().context` once, such as a filters UI built at that moment, found no filterable attributes. A config that fails to load still keeps the initial context and lets the counts go out for `price` alone.
