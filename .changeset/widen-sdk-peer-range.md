---
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

fix: widen the `@askdialog/dialog-sdk` peer dependency to `^2.0.1`

The peer was pinned to the exact version `2.0.0`, so installing the latest
`@askdialog/dialog-sdk@2.0.1` alongside `dialog-react`/`dialog-vue` produced a
peer-dependency mismatch warning (and an `ERESOLVE` error under strict peer
resolution). The peer is now a caret range (`^2.0.1`), accepting any compatible
`2.x` SDK release.
