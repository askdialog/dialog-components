---
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650)

The published `@askdialog/dialog-react@2.0.0` and `@askdialog/dialog-vue@3.0.0`
`latest` artifacts shipped a stale `@askdialog/dialog-sdk@1.2.0` peer dependency,
which made a clean install alongside `@askdialog/dialog-sdk@2.0.0` fail without
`--legacy-peer-deps`. The repository source already requires the `2.0.0` line;
the mismatch was introduced at pack time during the beta → production transition.

npm versions are immutable, so this cuts fresh patch releases (`2.0.1` / `3.0.1`)
with correct metadata. A publish-pipeline guard now inspects the packed tarball
before publishing to prevent the same drift from recurring.
