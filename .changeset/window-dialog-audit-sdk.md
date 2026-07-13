---
"@askdialog/dialog-sdk": minor
---

feat(sdk): merge `window.dialog` defensively and register installation audit metadata (DEC-2368)

The constructor no longer overwrites `window.dialog` wholesale: fields owned by other installation paths (e.g. GTM's `setVariant`/`getVariant` and its pre-init `_queue`) are now preserved. `window.dialog.instance` and `window.dialog.version` keep working unchanged.

The SDK also registers itself on the new shared audit surface `window.dialog.audit` (`methods` entry `{ method: 'sdk', version }`), so support can identify the installation path and version from the browser console. New exports: `registerDialogInstallation`, `addAuditCapability`, `exposeSdkOnWindowDialog` and the `DialogAudit*` types — the React/Vue wrappers use them to register their own entries.
